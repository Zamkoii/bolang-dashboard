"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  ClipboardList,
  MessageSquare,
  Search,
  Send,
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
  priorityReason: string;
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

const CHAT_CATEGORIES = [
  "Informasi Produk & Estimasi",
  "Ubah Data atau Kendala Pesanan",
  "Laporan Masalah Pengiriman & Barang Rusak",
] as const;

type ChatCategory = (typeof CHAT_CATEGORIES)[number];

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    sessionId: "demo-1",
    name: "Budi",
    category: "Informasi Produk & Estimasi",
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
    category: "Ubah Data atau Kendala Pesanan",
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
  const [activeCategory, setActiveCategory] = useState<ChatCategory | null>(null);
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

        const liveChats: Chat[] = data.map(
          (row: CustomerChatRow, index: number) => {
            const timeFormatted = new Date(row.created_at).toLocaleTimeString(
              "id-ID",
              { hour: "2-digit", minute: "2-digit" }
            );

            return {
              id: row.id,
              sessionId: row.session_id,
              name: row.customer_name || `Pelanggan #${row.id}`,
              category: row.category || "Umum",
              message: row.question || "",
              time: formatRelativeTime(row.created_at),
              unread: 0,
              tone: index % 2 === 0 ? ("indigo" as const) : ("fuchsia" as const),
              messages: [
                {
                  id: 1,
                  sender: "customer" as const,
                  text: row.question || "",
                  time: timeFormatted,
                },
              ],
            };
          }
        );

        setChats(liveChats);
      } catch {
        // Tetap menggunakan INITIAL_CHATS jika terjadi kendala
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedChat = chats.find((chat) => chat.id === selectedId) ?? null;

  const unreadTotal = chats.reduce((total, chat) => total + chat.unread, 0);

  const visibleChats = chats.filter(
    (chat) => activeCategory === null || chat.category === activeCategory
  );

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
        category: selectedChat.category || "Informasi Umum",
        priority: "Rendah",
        priorityReason:
          "Percakapan belum memiliki pertanyaan spesifik dari pelanggan.",
        confidence: "90%",
        sentiment: "Netral",
        summary:
          "Percakapan baru dibuat atau belum ada pertanyaan spesifik dari pelanggan.",
        draft:
          "Halo, ada yang bisa kami bantu terkait pesanan atau produk Bolang?",
      });
      return;
    }

    const latestCustomerMessage =
      customerMessages[customerMessages.length - 1]?.toLowerCase() ?? "";

    const hasComplaint = /rusak|bocor|retak|cembung|keluhan|komplain/.test(
      latestCustomerMessage
    );
    const hasPaymentIssue = /bayar|pembayaran|tagihan|refund|dana/.test(
      latestCustomerMessage
    );
    const hasShippingIssue = /kirim|pengiriman|resi|sampai|ongkir|kapan/.test(
      latestCustomerMessage
    );
    const hasStockQuestion = /stok|ready|tersedia|warna|varian/.test(
      latestCustomerMessage
    );

    // Kategori diambil dari kolom database, tidak ditimpa keyword.
    const category = selectedChat.category || "Informasi Umum";

    let priority: "Tinggi" | "Sedang" | "Rendah" = "Rendah";
    let priorityReason =
      "Percakapan bersifat informatif dan belum memerlukan tindakan mendesak.";
    let summary =
      "Pelanggan menanyakan informasi terkait produk atau pemesanan.";
    let draft =
      "Halo Kak, terima kasih sudah menghubungi kami. Ada yang bisa kami bantu terkait produk atau pesanan Kakak?";

    if (hasComplaint) {
      priority = "Tinggi";
      priorityReason =
        "Percakapan mengandung indikasi keluhan atau masalah yang perlu ditindaklanjuti.";
      summary =
        "Pelanggan menyampaikan keluhan atau kendala. Periksa seluruh riwayat percakapan untuk memahami masalahnya.";
      draft =
        "Halo Kak, mohon maaf atas ketidaknyamanan yang dialami. Kami akan membantu menindaklanjuti kendala tersebut. Boleh ceritakan detail masalahnya agar kami dapat memeriksa dan memberikan solusi yang sesuai?";
    } else if (hasPaymentIssue) {
      priority = "Tinggi";
      priorityReason =
        "Percakapan berkaitan dengan transaksi, tagihan, atau pengembalian dana yang perlu diperiksa.";
      summary =
        "Pelanggan membutuhkan bantuan terkait pembayaran atau transaksi.";
      draft =
        "Halo Kak, terima kasih sudah menghubungi kami. Kami bantu periksa kendala transaksi tersebut terlebih dahulu ya. Mohon informasikan detail transaksi yang dimaksud agar dapat kami tindak lanjuti.";
    } else if (hasShippingIssue) {
      priority = "Sedang";
      priorityReason =
        "Pelanggan membutuhkan informasi mengenai pesanan atau proses pengiriman.";
      summary =
        "Pelanggan menanyakan pesanan atau estimasi pengiriman.";
      draft =
        "Halo Kak, terima kasih sudah menghubungi kami. Kami bantu periksa status pesanan dan estimasi pengirimannya terlebih dahulu ya.";
    } else if (hasStockQuestion) {
      priority = "Sedang";
      priorityReason =
        "Pelanggan membutuhkan kepastian ketersediaan atau varian produk.";
      summary =
        "Pelanggan ingin mengetahui ketersediaan produk atau pilihan variannya.";
      draft =
        "Halo Kak, terima kasih sudah menghubungi kami. Kami bantu periksa ketersediaan produk dan varian yang Kakak inginkan terlebih dahulu ya.";
    }

    setAnalysis({
      category,
      priority,
      priorityReason,
      confidence: "96%",
      sentiment: hasComplaint || hasPaymentIssue ? "Negatif / Mendesak" : "Positif / Netral",
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

      {/* Filter kategori */}
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          title="Semua kategori"
          className={`relative flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === null
              ? "bg-[#38BDF8] text-white shadow-[0_8px_16px_rgba(56,189,248,0.35)]"
              : "bg-[#38BDF8]/80 text-white hover:bg-[#38BDF8]"
          }`}
        >
          <MessageSquare className="size-5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveCategory(
              activeCategory === CHAT_CATEGORIES[0] ? null : CHAT_CATEGORIES[0]
            )
          }
          title={CHAT_CATEGORIES[0]}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === CHAT_CATEGORIES[0]
              ? "bg-[#818CF8] text-white shadow-[0_8px_16px_rgba(129,140,248,0.35)]"
              : "bg-[#818CF8]/80 text-white hover:bg-[#818CF8]"
          }`}
        >
          <Search className="size-5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveCategory(
              activeCategory === CHAT_CATEGORIES[1] ? null : CHAT_CATEGORIES[1]
            )
          }
          title={CHAT_CATEGORIES[1]}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === CHAT_CATEGORIES[1]
              ? "bg-[#FDA4AF] text-white shadow-[0_8px_16px_rgba(253,164,175,0.35)]"
              : "bg-[#FDA4AF]/80 text-white hover:bg-[#FDA4AF]"
          }`}
        >
          <ClipboardList className="size-5" />
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveCategory(
              activeCategory === CHAT_CATEGORIES[2] ? null : CHAT_CATEGORIES[2]
            )
          }
          title={CHAT_CATEGORIES[2]}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === CHAT_CATEGORIES[2]
              ? "bg-[#FCA5A5] text-white shadow-[0_8px_16px_rgba(252,165,165,0.35)]"
              : "bg-[#FCA5A5]/80 text-white hover:bg-[#FCA5A5]"
          }`}
        >
          <AlertTriangle className="size-5" />
        </button>
      </div>

      {/* Konten utama */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
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

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          {selectedChat ? (
            <div className="flex h-full flex-col justify-between">
              <div>
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