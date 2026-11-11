"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, CloudUpload, Paperclip, Send } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { supabase } from "@/lib/supabase";
import { uploadDocToN8n, chatWithDocuments } from "./actions";
import { RichText } from "./rich-text";

type Message = {
  id: number;
  from: "user" | "bot";
  text: string;
  time: string;
  createdAt: number;
};

const MAX_FILE_MB = 5;
const ACCEPTED = /^image\/(png|jpe?g)$|^application\/pdf$/;
const PROCESSING_TEXT = "Dokumen sedang diproses oleh AI Agent…";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findStatusMessage(value: unknown): string | null {
  if (typeof value === "string") {
    return value.includes("✅") || value.includes("❌") ? value : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStatusMessage(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (
      typeof obj.message === "string" &&
      (obj.status === "success" || obj.status === "error")
    ) {
      return obj.message;
    }
    for (const item of Object.values(obj)) {
      const found = findStatusMessage(item);
      if (found) return found;
    }
  }
  return null;
}

type ScannedDoc = Record<string, unknown>;

function pickString(row: ScannedDoc, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export default function DocuSyncPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [latestFileName, setLatestFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Pesan sambutan — sesi chat selalu fresh saat halaman dibuka
  useEffect(() => {
    setMessages([
      {
        id: 1,
        from: "bot",
        text:
          "👋 Halo! Saya **DocuSync AI** PT Bolang Energy Indonesia.\n\n" +
          "Unggah dokumen (PO, Invoice, Kuotansi) untuk diekstraksi otomatis, " +
          "atau langsung ajukan pertanyaan apa saja di kolom bawah.",
        time: formatTime(new Date().toISOString()),
        createdAt: 0,
      },
    ]);
  }, []);

  // Konteks dokumen: ambil NAMA file terakhir saja (bukan riwayat gelembung)
  const loadContext = useCallback(async () => {
    const { data, error } = await supabase
      .from("scanned_documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return;
    setLatestFileName(
      pickString(data[0] as ScannedDoc, [
        "file_name", "filename", "name", "document_name",
      ])
    );
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // Realtime: konteks ikut terbarui saat dokumen baru diproses dari mana pun
  useEffect(() => {
    const channel = supabase
      .channel("docusync-context")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scanned_documents" },
        () => loadContext()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadContext]);

  useEffect(() => {
    historyRef.current?.scrollTo({
      top: historyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

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
    setNote("");

    const nowTime = formatTime(new Date().toISOString());
    const nowMs = Date.now();
    const botMsgId = nowMs + 1;

    setMessages((prev) => [
      ...prev,
      {
        id: nowMs,
        from: "user",
        text: `Unggah dokumen: ${file.name}`,
        time: nowTime,
        createdAt: nowMs,
      },
      {
        id: botMsgId,
        from: "bot",
        text: PROCESSING_TEXT,
        time: nowTime,
        createdAt: nowMs + 1000,
      },
    ]);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("file_name", file.name);

      const result = await uploadDocToN8n(body);

      let finalText: string;
      if (result.mock) {
        finalText = "Webhook ekstraksi belum diisi di .env.local — file tidak dikirim.";
      } else if (!result.ok) {
        finalText = `❌ Gagal memproses dokumen: ${result.error}`;
      } else {
        finalText =
          findStatusMessage(result.data) ??
          "✅ Dokumen berhasil diproses oleh AI Agent.";
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: finalText, time: formatTime(new Date().toISOString()) }
            : m
        )
      );

      setLatestFileName(file.name);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: `❌ Gagal: ${(err as Error).message}`,
                time: formatTime(new Date().toISOString()),
              }
            : m
        )
      );
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function sendCommand() {
    const text = command.trim();
    if (!text || busy) return;

    setBusy(true);
    setNote("");

    const nowTime = formatTime(new Date().toISOString());
    const nowMs = Date.now();

    setMessages((prev) => [
      ...prev,
      { id: nowMs, from: "user", text, time: nowTime, createdAt: nowMs },
    ]);
    setCommand("");

    try {
      const history = messages
        .filter((m) => m.text !== PROCESSING_TEXT)
        .slice(-10)
        .map((m) => ({
          role: m.from === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      const result = await chatWithDocuments({
        sessionId,
        question: text,
        fileName: latestFileName ?? null,
        history,
      });

      if (!result.ok) throw new Error(result.error);

      setMessages((prev) => [
        ...prev,
        {
          id: nowMs + 1,
          from: "bot",
          text: result.reply ?? "Tidak ada respon dari AI.",
          time: formatTime(new Date().toISOString()),
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nowMs + 1,
          from: "bot",
          text: `Gagal: ${(err as Error).message}`,
          time: formatTime(new Date().toISOString()),
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
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
            {latestFileName
              ? `Konteks: ${latestFileName}`
              : "Percakapan dengan AI Agent"}
          </span>
        </div>

        <div
          ref={historyRef}
          className="mt-3 flex max-h-[340px] flex-col gap-2.5 overflow-y-auto pr-1"
        >
          {messages.map((m) =>
            m.from === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[70%] rounded-2xl bg-[#2563EB] px-4 py-2.5">
                  <RichText
                    text={m.text}
                    className="text-[13px] leading-[18px] text-white [&_code]:bg-white/15"
                  />
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
                <div className="max-w-[70%] rounded-2xl bg-[#F1F5F9] px-4 py-2.5">
                  <RichText
                    text={m.text}
                    className="text-[13px] leading-[18px] text-[#111827]"
                  />
                  <span className="mt-0.5 block text-[10px] leading-3 text-[#94A3B8]">
                    {m.time}
                  </span>
                </div>
              </div>
            )
          )}

          {busy && (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#3B82F6]">
                <Bot className="size-4" strokeWidth={1.75} />
              </span>
              <div className="rounded-2xl bg-[#F1F5F9] px-4 py-2.5 text-[12px] text-[#94A3B8]">
                Mengetik...
              </div>
            </div>
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
            placeholder="Tanya isi dokumen atau ketik perintah..."
            className="flex-1 bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
          />
          <button
            type="button"
            onClick={sendCommand}
            disabled={busy || !command.trim()}
            aria-label="Kirim perintah"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition hover:bg-[#1D4ED8] disabled:opacity-40"
          >
            <Send className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}