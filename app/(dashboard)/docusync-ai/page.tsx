"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CloudUpload, Paperclip, Send } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { supabase } from "@/lib/supabase";
import { uploadDocToN8n } from "./actions";

type Message = { id: number; from: "user" | "bot"; text: string; time: string };

type DocRun = {
  id: string;
  file_name: string | null;
  status: string | null;
  result_summary: string | null;
  error_message: string | null;
  created_at: string;
};

const MESSAGES: Message[] = [
  { id: 1, from: "user", text: "Tolong analisa laporan penjualan Q3 ini.", time: "10:42 AM" },
  { id: 2, from: "bot", text: "Baik, saya sedang menganalisa dokumen laporan penjualan Q3. Ditemukan kenaikan 18% dibanding Q2.", time: "10:43 AM" },
  { id: 3, from: "user", text: "Bisa ekstrak data pelanggan teratas?", time: "10:45 AM" },
  { id: 4, from: "bot", text: "Tentu. Berikut top 3 pelanggan: PT Maju Jaya, PT Sejahtera, dan PT Nusantara.", time: "10:46 AM" },
];

const MAX_FILE_MB = 5;
const ACCEPTED = /^image\/(png|jpe?g)$|^application\/pdf$/;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function runsToMessages(runs: DocRun[]): Message[] {
  return runs
    .slice()
    .reverse()
    .flatMap((run) => {
      const time = formatTime(run.created_at);
      const runIdNum = Number(run.id.replace(/\D/g, "").slice(0, 8)) || 0;
      const entries: Message[] = [
        {
          id: runIdNum,
          from: "user",
          text: run.file_name ? `Unggah dokumen: ${run.file_name}` : "Unggah dokumen",
          time,
        },
      ];

      const reply =
        run.status === "done"
          ? run.result_summary || "Dokumen selesai diekstrak."
          : run.status === "error"
            ? `Gagal memproses dokumen: ${run.error_message || "terjadi kesalahan."}`
            : "Dokumen sedang diproses oleh AI Agent…";

      entries.push({
        id: runIdNum + 1,
        from: "bot",
        text: reply,
        time,
      });

      return entries;
    });
}

export default function DocuSyncPage() {
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const HISTORY_LIMIT = 5;

  async function loadRuns() {
    const { data, error } = await supabase
      .from("doc_processing_runs")
      .select("id, file_name, status, result_summary, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error || !data || data.length === 0) return;
    setMessages(runsToMessages(data as DocRun[]));
  }

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    historyRef.current?.scrollTo({
      top: historyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleFile(file: File | null) {
    if (!file || busy) return;
    setNote("");

    if (!ACCEPTED.test(file.type)) {
      setNote("Format harus PDF, PNG, atau JPG.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setNote(`Ukuran maksimal ${MAX_FILE_MB} MB.`);
      return;
    }

    setBusy(true);
    const now = formatTime(new Date().toISOString());
    const pendingId = Date.now();
    const botId = pendingId + 1;

    setMessages((prev) => [
      ...prev,
      { id: pendingId, from: "user", text: `Unggah dokumen: ${file.name}`, time: now },
    ]);

    try {
      const { data: run, error } = await supabase
        .from("doc_processing_runs")
        .insert({
          file_name: file.name,
          storage_path: null,
          status: "processing",
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      const body = new FormData();
      body.append("file", file);
      body.append("run_id", run.id);
      body.append("file_name", file.name);

      const result = await uploadDocToN8n(body);

      if (!result.ok) {
        throw new Error(result.error || "Gagal mengirim dokumen");
      }

      const botReply = result.mock
        ? `Dokumen "${file.name}" sudah dicatat di database. Webhook n8n belum dikonfigurasi di .env.local, jadi proses ekstraksi ditunda.`
        : `Dokumen "${file.name}" sedang diproses oleh AI Agent…`;

      setMessages((prev) => [
        ...prev,
        { id: botId, from: "bot", text: botReply, time: formatTime(new Date().toISOString()) },
      ]);

      await loadRuns();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: botId, from: "bot", text: `Gagal: ${(err as Error).message}`, time: formatTime(new Date().toISOString()) },
      ]);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function sendCommand() {
    const text = command.trim();
    if (!text || busy) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: "user",
        text,
        time: formatTime(new Date().toISOString()),
      },
      {
        id: Date.now() + 1,
        from: "bot",
        text: "Perintah diterima. Unggah dokumen (PDF/PNG/JPG) agar AI Agent dapat memprosesnya.",
        time: formatTime(new Date().toISOString()),
      },
    ]);

    setCommand("");
  }

  return (
    <div className="flex min-h-[calc(100vh-30px)] flex-col px-10 pb-10 pt-[30px]">
      <Breadcrumb current="DocuSync AI" />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="mt-3 flex h-[175px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#BFDBFE] bg-[#EFF6FF] transition hover:bg-[#E8F2FF]"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-white text-[#3B82F6] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <CloudUpload className="size-6" strokeWidth={1.75} />
        </span>
        <span className="mt-3 text-[14px] font-bold text-[#111827]">
          Seret &amp; lepas dokumen Anda di sini
        </span>
        <span className="mt-2 text-[13px] text-[#6B7280]">
          atau cari file (PDF, PNG, JPG)
        </span>
      </label>

      {note && <p className="mt-2 text-[12px] text-red-500">{note}</p>}

      <section className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#111827]">History Chat</h2>
          <span className="text-[12px] text-[#9CA3AF]">
            Percakapan dengan AI Agent
          </span>
        </div>

        <div
          ref={historyRef}
          className="mt-3 flex max-h-[340px] flex-col gap-2.5 overflow-y-auto pr-1"
        >
          {messages.map((m) =>
            m.from === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[70%] rounded-2xl bg-[#2563EB] px-4 py-2.5 text-white">
                  <p className="text-[13px] leading-[18px]">{m.text}</p>
                  <span className="mt-0.5 block text-[10px] leading-3 text-white/70">
                    {m.time}
                  </span>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#3B82F6]">
                  <Bot className="size-4" strokeWidth={1.75} />
                </span>
                <div className="max-w-[70%] rounded-2xl bg-[#F1F5F9] px-4 py-2.5 text-[#111827]">
                  <p className="text-[13px] leading-[18px]">{m.text}</p>
                  <span className="mt-0.5 block text-[10px] leading-3 text-[#94A3B8]">
                    {m.time}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <div className="mt-auto pt-6">
        <div className="flex h-[78px] items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-[22px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Lampirkan file"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] transition hover:bg-[#E8EDF3]"
          >
            <Paperclip className="size-5" strokeWidth={1.75} />
          </button>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendCommand();
            }}
            placeholder="Silakan upload file Anda atau ketik perintah..."
            className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
          />
          <button
            type="button"
            onClick={sendCommand}
            disabled={busy || !command.trim()}
            aria-label="Kirim perintahh"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition hover:bg-[#1D4ED8] disabled:opacity-40"
          >
            <Send className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
