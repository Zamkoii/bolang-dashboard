import { Bot, CloudUpload, Paperclip, Send } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

type Message = { id: number; from: "user" | "bot"; text: string; time: string };

const MESSAGES: Message[] = [
  { id: 1, from: "user", text: "Tolong analisa laporan penjualan Q3 ini.", time: "10:42 AM" },
  { id: 2, from: "bot", text: "Baik, saya sedang menganalisa dokumen laporan penjualan Q3. Ditemukan kenaikan 18% dibanding Q2.", time: "10:43 AM" },
  { id: 3, from: "user", text: "Bisa ekstrak data pelanggan teratas?", time: "10:45 AM" },
  { id: 4, from: "bot", text: "Tentu. Berikut top 3 pelanggan: PT Maju Jaya, PT Sejahtera, dan PT Nusantara.", time: "10:46 AM" },
];

export default function DocuSyncPage() {
  return (
    <div className="flex min-h-full flex-col px-10 pb-7 pt-[26px]">
      <Breadcrumb current="DocuSync AI" />

      {/* Area upload */}
      <label className="mt-[18px] flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[#93C5FD] bg-[#EFF6FF] transition hover:bg-[#E8F1FE]">
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" />
        <span className="flex size-14 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
          <CloudUpload className="size-7" strokeWidth={1.75} />
        </span>
        <span className="mt-4 text-[16px] font-bold text-[#1E3A8A]">
          Seret &amp; lepas dokumen Anda di sini
        </span>
        <span className="mt-2 text-[13px] text-[#6B7280]">
          atau cari file (PDF, PNG, JPG)
        </span>
      </label>

      {/* Riwayat chat */}
      <section className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#111827]">History Chat</h2>
          <span className="text-[12px] text-[#9CA3AF]">
            Percakapan dengan AI Agent
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {MESSAGES.map((m) =>
            m.from === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[520px] rounded-2xl bg-[#2563EB] px-3.5 py-2.5 text-white">
                  <p className="text-[13px] leading-[18px]">{m.text}</p>
                  <span className="mt-0.5 block text-[10px] leading-3 text-white/70">
                    {m.time}
                  </span>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2.5">
                <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                  <Bot className="size-[14px]" strokeWidth={2} />
                </span>
                <div className="max-w-[520px] rounded-2xl bg-[#F1F5F9] px-3.5 py-2.5 text-[#374151]">
                  <p className="text-[13px] leading-[18px]">{m.text}</p>
                  <span className="mt-0.5 block text-[10px] leading-3 text-[#94A3B8]">
                    {m.time}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Input perintah (menempel di bawah) */}
      <div className="mt-auto pt-6">
        <div className="flex h-[78px] items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-[22px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            aria-label="Lampirkan file"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] transition hover:bg-[#E8EDF3]"
          >
            <Paperclip className="size-5" strokeWidth={1.75} />
          </button>
          <input
            type="text"
            placeholder="Silakan upload file Anda atau ketik perintah..."
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
          />
          <button
            type="button"
            aria-label="Kirim"
            className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition hover:bg-[#1D4ED8]"
          >
            <Send className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}