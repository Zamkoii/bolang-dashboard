"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  id: number;
  sender: "customer" | "agent";
  text: string;
  time: string;
};

type Chat = {
  id: number;
  sessionId: string;
  name: string;
  category: string;
  message: string;
  time: string;
  unread: number;
  tone: "indigo" | "fuchsia";
  messages: ChatMessage[];
};

type Analysis = {
  category: string;
  priority: "Tinggi" | "Sedang" | "Rendah";
  confidence: string;
  sentiment: string;
  summary: string;
  draft: string;
};

type CustomerChatRow = {
  id: number;
  session_id: string;
  customer_name: string | null;
  category: string | null;
  question: string | null;
  created_at: string;
};

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    sessionId: "demo-1",
    name: "Budi",
    category: "Informasi Produk",
    message: "Apakah stok produk A warna pink masih ada?",
    time: "3m ago",
    unread: 2,
    tone: "indigo",
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Apakah stok produk A warna pink masih ada?",
        time: "10:22",
      },
    ],
  },
  {
    id: 2,
    sessionId: "demo-2",
    name: "Karina",
    category: "Logistik & Pengiriman",
    message: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
    time: "15m ago",
    unread: 0,
    tone: "fuchsia",
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
        time: "10:08",
      },
    ],
  },
];

const AVATAR_TONE = {
  indigo: {
    bg: "bg-[#EEF2FF]",
    text: "text-[#6366F1]",
  },
  fuchsia: {
    bg: "bg-[#FDF4FF]",
    text: "text-[#D946EF]",
  },
};

const CHAT_CATEGORIES = [
  "Informasi Produk & Estimasi",
  "Ubah Data atau Kendala Pesanan",
  "Laporan Masalah Pengiriman & Barang Rusak",
] as const;

type ChatCategory = (typeof CHAT_CATEGORIES)[number];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FrontlineAIPage() {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      try {
        const { data, error } = await supabase
          .from("customer_chats")
          .select("id, session_id, customer_name, category, question, created_at")
          .order("created_at", { ascending: false });

        if (!isMounted || error || !data || data.length === 0) return;

        const liveChats: Chat[] = data.map((row: CustomerChatRow, index: number) => {
          const timeFormatted = new Date(row.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            id: row.id,
            sessionId: row.session_id,
            name: row.customer_name || `Pelanggan #${row.id}`,
            category: row.category || "Umum",
            message: row.question || "",
            time: formatRelativeTime(row.created_at),
            unread: 0,
            tone: index % 2 === 0 ? "indigo" : "fuchsia",
            messages: [
              {
                id: 1,
                sender: "customer",
                text: row.question || "",
                time: timeFormatted,
              },
            ],
          };
        });

        setChats(liveChats);
      } catch {
        // Fallback ke INITIAL_CHATS jika ada kendala
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedChat = chats.find((chat) => chat.id === selectedId) ?? null;

  const unreadTotal = chats.reduce((total, chat) => total + chat.unread, 0);

  const visibleChats =
    filter === "unread" ? chats.filter((chat) => chat.unread > 0) : chats;

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

    const customerMessages = selectedChat.messages
      .filter((message) => message.sender === "customer")
      .map((message) => message.text.trim())
      .filter(Boolean);

    if (customerMessages.length === 0) {
      setAnalysis({
        category: "Informasi Umum",
        priority: "Rendah",
        confidence: "90%",
        sentiment: "Netral",
        summary: "Percakapan baru dibuat atau belum ada pertanyaan spesifik dari pelanggan.",
        draft: "Halo, ada yang bisa kami bantu terkait pesanan atau produk Bolang?",
      });
      return;
    }

    const latestCustomerMessage =
      customerMessages[customerMessages.length - 1]?.toLowerCase() ?? "";

    let category = selectedChat.category || "Informasi Produk";
    let priority: "Tinggi" | "Sedang" | "Rendah" = "Rendah";
    let sentiment = "Positif / Netral";
    let summary = "Pelanggan menanyakan informasi terkait produk atau pemesanan.";
    let draft = "Halo! Terima kasih sudah menghubungi kami. Pesanan Anda siap kami bantu proses.";

    if (/rusak|bocor|retak|cembung|panas|kendala/.test(latestCustomerMessage)) {
      category = "Masalah Produk / Klaim Garansi";
      priority = "Tinggi";
      sentiment = "Negatif / Mendesak";
      summary = "Pelanggan melaporkan kendala fisik atau kerusakan pada unit baterai.";
      draft =
        "Halo, mohon maaf atas kendala yang dialami. Kami siap membantu proses klaim garansi. Boleh kirimkan kode pesanan Anda?";
    } else if (/sampai|kirim|resi|ongkir|bogor|kapan/.test(latestCustomerMessage)) {
      category = "Logistik & Pengiriman";
      priority = "Sedang";
      sentiment = "Menunggu Informasi";
      summary = "Pelanggan menanyakan perkiraan waktu tiba dan proses pengiriman barang.";
      draft =
        "Halo! Estimasi pengiriman ke lokasi Anda adalah 2-3 hari kerja. Pesanan akan segera kami proses.";
    }

    setAnalysis({
      category,
      priority,
      confidence: "96%",
      sentiment,
      summary,
      draft,
    });
  }

  function sendReply() {
    const cleanReply = reply.trim();
    if (!cleanReply || !selectedChat) return;

    const newMessage: ChatMessage = {
      id: selectedChat.messages.length + 1,
      sender: "agent",
      text: cleanReply,
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
              message: cleanReply,
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    );

    setReply("");
  }

  return (
    <div className="px-10 pb-10 pt-[30px]">
      <Breadcrumb current="Frontline AI" />

      {/* Filter Kategori Header */}
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`relative flex size-[42px] items-center justify-center rounded-xl transition ${
            filter === "all"
              ? "bg-[#38BDF8] text-white shadow-[0_8px_16px_rgba(56,189,248,0.35)]"
              : "bg-white text-[#94A3B8] hover:bg-slate-50"
          }`}
        >
          <MessageSquare className="size-5" />
          {unreadTotal > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
              {unreadTotal > 50 ? "50+" : unreadTotal}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            filter === "unread"
              ? "bg-[#818CF8] text-white shadow-[0_8px_16px_rgba(129,140,248,0.35)]"
              : "bg-[#818CF8]/80 text-white hover:bg-[#818CF8]"
          }`}
        >
          <Sparkles className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => setFilter("resolved")}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            filter === "resolved"
              ? "bg-[#FDA4AF] text-white shadow-[0_8px_16px_rgba(253,164,175,0.35)]"
              : "bg-[#FDA4AF]/80 text-white hover:bg-[#FDA4AF]"
          }`}
        >
          <ShieldAlert className="size-5" />
        </button>
      </div>

      {/* Konten Utama: 2 Kolom */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
        {/* Kolom Kiri: Daftar Percakapan */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#1E293B]">
              Percakapan pelanggan
            </h2>
            <span className="text-[12px] text-[#94A3B8]">
              {visibleChats.length} percakapan
            </span>
          </div>

          <div className="space-y-3">
            {visibleChats.map((chat) => {
              const tone = AVATAR_TONE[chat.tone];
              const isSelected = chat.id === selectedId;

              return (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-[#38BDF8] bg-white shadow-[0_4px_12px_rgba(56,189,248,0.15)]"
                      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                  }`}
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.text}`}
                  >
                    <User className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#1E293B]">
                          {chat.name}
                        </span>
                        {chat.unread > 0 && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">
                        {chat.time}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-[12.5px] text-[#64748B]">
                      {chat.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Detail Percakapan & AI Assistant */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          {selectedChat ? (
            <div className="flex h-full flex-col justify-between">
              <div>
                {/* Header Chat Terpilih */}
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${
                        AVATAR_TONE[selectedChat.tone].bg
                      } ${AVATAR_TONE[selectedChat.tone].text}`}
                    >
                      <User className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1E293B]">
                        {selectedChat.name}
                      </h3>
                      <p className="text-[11px] text-[#94A3B8]">
                        Kategori: {selectedChat.category} • {selectedChat.time}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={analyzeSelectedChat}
                    className="flex items-center gap-1.5 rounded-lg bg-[#F0FDF4] px-3 py-1.5 text-[12px] font-semibold text-[#16A34A] transition hover:bg-[#DCFCE7]"
                  >
                    <Sparkles className="size-3.5" />
                    Analisis Percakapan
                  </button>
                </div>

                {/* Hasil Analisis AI */}
                {analysis && (
                  <div className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4]/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">
                        <Bot className="size-3" />
                        {analysis.category}
                      </span>
                      <span className="text-[11px] font-medium text-[#15803D]">
                        Prioritas: {analysis.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-[12.5px] leading-relaxed text-[#166534]">
                      {analysis.summary}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-[#DCFCE7] pt-2.5">
                      <span className="text-[11px] text-[#15803D]">
                        Rekomendasi draf balasan siap digunakan
                      </span>
                      <button
                        type="button"
                        onClick={() => setReply(analysis.draft)}
                        className="text-[11px] font-bold text-[#15803D] underline transition hover:text-[#14532D]"
                      >
                        Gunakan Draf
                      </button>
                    </div>
                  </div>
                )}

                {/* Daftar Balon Pesan */}
                <div className="mt-6 max-h-[360px] space-y-3.5 overflow-y-auto pr-2">
                  {selectedChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === "agent" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                          msg.sender === "agent"
                            ? "bg-[#1D2B4D] text-white"
                            : "bg-[#F1F5F9] text-[#1E293B]"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="mt-1 text-[10px] text-[#94A3B8]">
                        {msg.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Kirim Balasan */}
              <div className="mt-6 border-t border-[#F1F5F9] pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendReply();
                    }}
                    placeholder="Ketik balasan untuk pelanggan..."
                    className="h-10 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-[13px] text-[#1E293B] outline-none transition focus:border-[#38BDF8]"
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    className="flex h-10 items-center gap-1.5 rounded-xl bg-[#1D2B4D] px-4 text-[13px] font-semibold text-white transition hover:bg-[#25395F]"
                  >
                    <Send className="size-3.5 text-[#FFD11A]" />
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0F9FF] text-[#0284C7]">
                <MessageSquare className="size-6" />
              </div>
              <h3 className="mt-3 text-[15px] font-bold text-[#1E293B]">
                Pilih percakapan
              </h3>
              <p className="mt-1 max-w-[260px] text-[12.5px] leading-relaxed text-[#64748B]">
                Pilih salah satu pelanggan untuk melihat pesan dan mencoba mengirim balasan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}