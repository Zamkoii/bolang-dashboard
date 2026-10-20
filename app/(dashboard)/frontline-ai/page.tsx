
"use client";

import { useState } from "react";
import {
  MessageSquare,
  PencilLine,
  ShieldAlert,
  User,
  Send,
  Bot,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

type ChatMessage = {
  id: number;
  sender: "customer" | "agent";
  text: string;
  time: string;
};

type Chat = {
  id: number;
  name: string;
  message: string;
  time: string;
  unread: number;
  tone: "indigo" | "fuchsia";
  messages: ChatMessage[];
};

type AnalysisResult = {
  chatId: number;
  category: string;
  priority: "Tinggi" | "Sedang" | "Rendah";
  summary: string;
  draft: string;
};

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    name: "Budi",
    message: "Apakah stok produk A warna pink masih ada?",
    time: "3m ago",
    unread: 2,
    tone: "indigo",
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Halo, saya ingin bertanya tentang produk A.",
        time: "10:20",
      },
      {
        id: 2,
        sender: "customer",
        text: "Apakah stok produk A warna pink masih ada?",
        time: "10:22",
      },
    ],
  },
  {
    id: 2,
    name: "Karina",
    message: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
    time: "15m ago",
    unread: 0,
    tone: "fuchsia",
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Halo, saya mau menanyakan pengiriman pesanan.",
        time: "10:05",
      },
      {
        id: 2,
        sender: "customer",
        text: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
        time: "10:08",
      },
    ],
  },
  {
    id: 3,
    name: "Budi",
    message: "Apakah stok produk A warna pink masih ada?",
    time: "1h ago",
    unread: 0,
    tone: "indigo",
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Apakah stok produk A warna pink masih ada?",
        time: "09:15",
      },
    ],
  },
  {
    id: 4,
    name: "Karina",
    message: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
    time: "2h ago",
    unread: 0,
    tone: "fuchsia",
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
        time: "08:10",
      },
    ],
  },
];

const AVATAR_TONE = {
  indigo: "border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]",
  fuchsia: "border-[#F5D0FE] bg-[#FDF4FF] text-[#C026D3]",
} as const;

export default function FrontlineAIPage() {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedId);

  const unreadTotal = chats.reduce(
    (total, chat) => total + chat.unread,
    0
  );

  const visibleChats =
    filter === "unread"
      ? chats.filter((chat) => chat.unread > 0)
      : chats;

function openChat(chat: Chat) {
  setSelectedId(chat.id);
  setAnalysis(null);

  setChats((previous) =>
    previous.map((item) =>
      item.id === chat.id ? { ...item, unread: 0 } : item
    )
  );
}

  function analyzeSelectedChat() {
  if (!selectedChat) return;

  const latestCustomerMessage = [...selectedChat.messages]
    .reverse()
    .find((message) => message.sender === "customer");

  if (!latestCustomerMessage) return;

  const text = latestCustomerMessage.text.toLowerCase();

  let category = "Pertanyaan umum";
  let priority: AnalysisResult["priority"] = "Rendah";
  let summary = "Pelanggan membutuhkan informasi lebih lanjut.";
  let draft =
    "Halo Kak, terima kasih sudah menghubungi kami. Bisa dijelaskan lebih lanjut mengenai kebutuhan Kakak agar kami dapat membantu dengan tepat?";

  if (
    text.includes("stok") ||
    text.includes("tersedia") ||
    text.includes("persediaan")
  ) {
    category = "Pertanyaan stok";
    priority = "Sedang";
    summary = "Pelanggan ingin mengetahui ketersediaan produk.";
    draft =
      "Halo Kak, terima kasih sudah menghubungi kami. Untuk ketersediaan produk tersebut, kami bantu cek terlebih dahulu ya. Mohon tunggu sebentar.";
  } else if (
    text.includes("kirim") ||
    text.includes("pengiriman") ||
    text.includes("estimasi") ||
    text.includes("sampai") ||
    text.includes("pesanan")
  ) {
    category = "Pengiriman pesanan";
    priority = "Sedang";
    summary = "Pelanggan menanyakan status atau estimasi pengiriman.";
    draft =
      "Halo Kak, terima kasih sudah menghubungi kami. Kami bantu cek status dan estimasi pengiriman pesanan Kakak terlebih dahulu ya.";
  } else if (
    text.includes("komplain") ||
    text.includes("kecewa") ||
    text.includes("rusak") ||
    text.includes("terlambat") ||
    text.includes("masalah")
  ) {
    category = "Keluhan pelanggan";
    priority = "Tinggi";
    summary = "Pelanggan menyampaikan masalah yang perlu ditindaklanjuti.";
    draft =
      "Halo Kak, mohon maaf atas ketidaknyamanan yang dialami. Kami akan membantu menindaklanjuti masalah ini. Boleh ceritakan detail kendalanya agar kami dapat membantu dengan tepat?";
  } else if (
    text.includes("bayar") ||
    text.includes("pembayaran") ||
    text.includes("refund") ||
    text.includes("pengembalian dana")
  ) {
    category = "Pembayaran";
    priority = "Tinggi";
    summary = "Pelanggan membutuhkan bantuan terkait transaksi atau pembayaran.";
    draft =
      "Halo Kak, terima kasih sudah menghubungi kami. Kami bantu periksa kendala pembayarannya terlebih dahulu ya. Jika memungkinkan, mohon jelaskan detail transaksi yang dimaksud.";
  }

  setAnalysis({
    chatId: selectedChat.id,
    category,
    priority,
    summary,
    draft,
  });
}

  function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = reply.trim();

    if (!text || !selectedChat) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: "agent",
      text,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChats((previous) =>
      previous.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              message: text,
              time: "Baru saja",
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    );

    setReply("");
  }

  return (
    <div className="px-4 pb-8 pt-8 md:px-8">
      <Breadcrumb current="Frontline AI" />

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("all")}
          aria-label="Semua pesan"
          className={`relative flex h-11 w-16 items-center justify-center rounded-xl text-white transition hover:brightness-95 ${
            filter === "all" ? "bg-[#38BDF8]" : "bg-[#7DD3FC]"
          }`}
        >
          <MessageSquare className="size-5" strokeWidth={1.75} />
          {unreadTotal > 0 && (
            <span className="absolute -left-[5px] -top-[7px] rounded-full bg-[#EF4444] px-[5px] py-px text-[10px] font-bold leading-[14px] text-white">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilter("unread")}
          aria-label="Pesan belum dibaca"
          className={`flex h-11 w-16 items-center justify-center rounded-xl text-white transition hover:brightness-95 ${
            filter === "unread" ? "bg-[#6366F1]" : "bg-[#818CF8]"
          }`}
        >
          <PencilLine className="size-5" strokeWidth={1.75} />
        </button>

        <button
          onClick={() =>
            window.alert(
              "Simulasi: daftar percakapan yang perlu perhatian akan tersedia di tahap berikutnya."
            )
          }
          aria-label="Peringatan"
          className="flex h-11 w-16 items-center justify-center rounded-xl bg-[#FCA5A5] text-white transition hover:brightness-95"
        >
          <ShieldAlert className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
        {/* Daftar chat */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#111827]">
              Percakapan pelanggan
            </h2>
            <span className="text-xs text-[#6B7280]">
              {visibleChats.length} percakapan
            </span>
          </div>

          <ul className="flex flex-col gap-[10px]">
            {visibleChats.map((chat) => (
              <li key={chat.id}>
                <button
                  onClick={() => openChat(chat)}
                  className={`flex min-h-[86px] w-full items-center gap-4 rounded-xl border px-4 py-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition ${
                    selectedId === chat.id
                      ? "border-[#818CF8] bg-[#F5F7FF]"
                      : "border-[#E5E7EB] bg-white hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex size-[46px] shrink-0 items-center justify-center rounded-full border ${AVATAR_TONE[chat.tone]}`}
                  >
                    <User className="size-5" strokeWidth={1.75} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-[#111827]">
                        {chat.name}
                      </span>
                      {chat.unread > 0 && (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[12px] font-semibold text-white">
                          {chat.unread}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-[13px] text-[#4B5563]">
                      {chat.message}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#9CA3AF]">
                      {chat.time}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {visibleChats.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Tidak ada pesan belum dibaca.
            </div>
          )}
        </section>

        {/* Detail percakapan */}
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
                <span
                  className={`flex size-10 items-center justify-center rounded-full border ${AVATAR_TONE[selectedChat.tone]}`}
                >
                  <User className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#111827]">
                    {selectedChat.name}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Percakapan pelanggan
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2 py-1 text-xs font-medium text-[#4F46E5]">
                  <Bot className="size-3.5" />
                  AI siap membantu
                </span>
                <button
  type="button"
  onClick={analyzeSelectedChat}
  className="flex shrink-0 items-center gap-2 rounded-xl bg-[#4F46E5] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#4338CA]"
>
  <Sparkles className="size-4" />
  <span className="hidden sm:inline">Analisis dengan AI</span>
</button>
              </div>

              <div className="flex min-h-[320px] flex-col gap-4 bg-[#F9FAFB] p-5">
                {selectedChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "agent"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.sender === "agent"
                          ? "rounded-br-sm bg-[#4F46E5] text-white"
                          : "rounded-bl-sm border border-[#E5E7EB] bg-white text-[#111827]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.text}
                      </p>
                      <div
                        className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${
                          message.sender === "agent"
                            ? "text-indigo-100"
                            : "text-gray-400"
                        }`}
                      >
                        {message.time}
                        {message.sender === "agent" && (
                          <CheckCheck className="size-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

{analysis?.chatId === selectedChat.id && (
  <div className="border-t border-[#E5E7EB] bg-white p-4">
    <div className="rounded-xl border border-[#C7D2FE] bg-[#F8FAFF] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-[#4F46E5]" />
        <h4 className="font-semibold text-[#111827]">
          Hasil Analisis AI
        </h4>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs text-[#6B7280]">Kategori pesan</p>
          <p className="mt-1 font-medium text-[#111827]">
            {analysis.category}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#6B7280]">Prioritas</p>
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              analysis.priority === "Tinggi"
                ? "bg-red-100 text-red-700"
                : analysis.priority === "Sedang"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {analysis.priority}
          </span>
        </div>

        <div>
          <p className="text-xs text-[#6B7280]">Ringkasan</p>
          <p className="mt-1 text-[#374151]">
            {analysis.summary}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#6B7280]">Rekomendasi balasan</p>
          <p className="mt-1 rounded-lg border border-[#E5E7EB] bg-white p-3 leading-6 text-[#374151]">
            {analysis.draft}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReply(analysis.draft)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2.5 font-medium text-white transition hover:bg-[#4338CA]"
        >
          <PencilLine className="size-4" />
          Gunakan draf
        </button>
      </div>

      <p className="mt-3 text-[11px] text-[#9CA3AF]">
        Hasil simulasi lokal. Periksa kebenaran informasi sebelum mengirim balasan.
      </p>
    </div>
  </div>
)}
              <form
                onSubmit={sendReply}
                className="flex items-end gap-3 border-t border-[#E5E7EB] p-4"
              >
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Tulis balasan pelanggan..."
                  rows={2}
                  className="min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  disabled={!reply.trim()}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5] text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Kirim balasan"
                >
                  <Send className="size-4" />
                </button>
              </form>
              <p className="px-4 pb-3 text-[11px] text-gray-400">
                Mode demo: balasan hanya disimpan sementara di browser.
              </p>
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
                <MessageSquare className="size-7" />
              </span>
              <h3 className="mt-4 font-semibold text-[#111827]">
                Pilih percakapan
              </h3>
              <p className="mt-2 max-w-xs text-sm text-[#6B7280]">
                Pilih salah satu pelanggan untuk melihat pesan dan mencoba
                mengirim balasan.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
