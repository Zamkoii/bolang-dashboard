"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  ClipboardList,
  Hand,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  id: number;
  sender: "customer" | "agent" | "ai";
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
  tone: "indigo" | "fuchsia";
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

type ChatMessageRow = {
  id: number;
  session_id: string;
  sender: string;
  message: string;
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
    tone: "indigo",
  },
  {
    id: 2,
    sessionId: "demo-2",
    name: "Karina",
    category: "Ubah Data atau Kendala Pesanan",
    message: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
    time: "15m ago",
    tone: "fuchsia",
  },
];

const DEMO_THREADS: Record<string, ChatMessage[]> = {
  "demo-1": [
    {
      id: 1,
      sender: "customer",
      text: "Apakah stok produk A warna pink masih ada?",
      time: "10:22",
    },
  ],
  "demo-2": [
    {
      id: 1,
      sender: "customer",
      text: "Kira-kira estimasi sampai barangnya ke Bogor berapa hari ya?",
      time: "10:08",
    },
  ],
};

const AVATAR_TONE = {
  indigo: { bg: "bg-[#EEF2FF]", text: "text-[#6366F1]" },
  fuchsia: { bg: "bg-[#FDF4FF]", text: "text-[#D946EF]" },
};

const POLL_MS = 3000;

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
  const [activeCategory, setActiveCategory] =
    useState<ChatCategory>(CHAT_CATEGORIES[0]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [handledBy, setHandledBy] = useState<"ai" | "human">("ai");
  const [busyAction, setBusyAction] = useState(false);
  const [note, setNote] = useState("");

  const threadRef = useRef<HTMLDivElement>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedId) ?? null;
  const sessionId = selectedChat?.sessionId ?? null;

  // ---- daftar sesi dari customer_chats ----
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("customer_chats")
        .select("id, session_id, customer_name, category, question, created_at")
        .order("created_at", { ascending: false });

      if (!mounted || error || !data || data.length === 0) return;

      setChats(
        data.map((row: CustomerChatRow, index: number) => ({
          id: row.id,
          sessionId: row.session_id,
          name: row.customer_name || `Pelanggan #${row.id}`,
          category: row.category || "Umum",
          message: row.question || "",
          time: formatRelativeTime(row.created_at),
          tone: index % 2 === 0 ? ("indigo" as const) : ("fuchsia" as const),
        }))
      );
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---- isi percakapan + status pengelolaan, polling ----
  const loadThread = useCallback(async () => {
    if (!sessionId) return;

    const [msgs, handover] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("id, session_id, sender, message, created_at")
        .eq("session_id", sessionId)
        .order("id", { ascending: true }),
      supabase
        .from("chat_handover")
        .select("session_id, handled_by")
        .eq("session_id", sessionId)
        .maybeSingle(),
    ]);

    if (!msgs.error && msgs.data && msgs.data.length > 0) {
      setThread(
        (msgs.data as ChatMessageRow[]).map((m) => ({
          id: m.id,
          sender:
            m.sender === "customer"
              ? "customer"
              : m.sender === "agent"
                ? "agent"
                : "ai",
          text: m.message,
          time: new Date(m.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    } else {
      setThread(DEMO_THREADS[sessionId] ?? []);
    }

    setHandledBy(handover.data?.handled_by === "human" ? "human" : "ai");
  }, [sessionId]);

  useEffect(() => {
    setAnalysis(null);
    setNote("");
    loadThread();

    if (!sessionId) return;
    const timer = setInterval(loadThread, POLL_MS);
    return () => clearInterval(timer);
  }, [sessionId, loadThread]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [thread]);

  const visibleChats = chats.filter(
    (chat) => chat.category === activeCategory
  );

  function openChat(chat: Chat) {
    setSelectedId(chat.id);
    setAnalysis(null);
  }

  // ---- ambil alih / kembalikan ke AI ----
  async function setHandover(next: "ai" | "human") {
    if (!sessionId || busyAction) return;
    setBusyAction(true);
    setNote("");

    const { error } = await supabase.from("chat_handover").upsert(
      {
        session_id: sessionId,
        handled_by: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    );

    if (error) {
      setNote(`Gagal: ${error.message}`);
    } else {
      setHandledBy(next);
      setNote(
        next === "human"
          ? "Percakapan diambil alih. Balasan AI otomatis dihentikan."
          : "Percakapan dikembalikan ke AI."
      );
    }

    setBusyAction(false);
  }

  // ---- kirim balasan CS ----
  async function sendReply() {
    const cleanReply = reply.trim();
    if (!cleanReply || !sessionId || handledBy !== "human") return;

    setBusyAction(true);
    setNote("");

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender: "agent",
      message: cleanReply,
    });

    if (error) {
      setNote(`Gagal mengirim: ${error.message}`);
    } else {
      setReply("");
      await loadThread();
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    }

    setBusyAction(false);
  }

  function analyzeSelectedChat() {
    if (!selectedChat) return;

    const customerMessages = thread
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
      summary = "Pelanggan menanyakan pesanan atau estimasi pengiriman.";
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
      sentiment:
        hasComplaint || hasPaymentIssue ? "Negatif / Mendesak" : "Positif / Netral",
      summary,
      draft,
    });
  }

  return (
    <div className="px-10 pb-10 pt-[30px]">
      <Breadcrumb current="Frontline AI" />

      {/* Filter kategori: Blue, Green, Red */}
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveCategory(CHAT_CATEGORIES[0])}
          title={CHAT_CATEGORIES[0]}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === CHAT_CATEGORIES[0]
              ? "bg-[#0EA5E9] text-white shadow-[0_8px_16px_rgba(14,165,233,0.45)] ring-2 ring-[#0EA5E9]/40"
              : "bg-[#0EA5E9]/20 text-[#0EA5E9] hover:bg-[#0EA5E9]/35"
          }`}
        >
          <Search className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory(CHAT_CATEGORIES[1])}
          title={CHAT_CATEGORIES[1]}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === CHAT_CATEGORIES[1]
              ? "bg-[#16A34A] text-white shadow-[0_8px_16px_rgba(22,163,74,0.45)] ring-2 ring-[#16A34A]/40"
              : "bg-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/35"
          }`}
        >
          <ClipboardList className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory(CHAT_CATEGORIES[2])}
          title={CHAT_CATEGORIES[2]}
          className={`flex size-[42px] items-center justify-center rounded-xl transition ${
            activeCategory === CHAT_CATEGORIES[2]
              ? "bg-[#EF4444] text-white shadow-[0_8px_16px_rgba(239,68,68,0.45)] ring-2 ring-[#EF4444]/40"
              : "bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/35"
          }`}
        >
          <AlertTriangle className="size-5" />
        </button>
      </div>

      {/* Konten utama */}
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]">
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
                      <span className="text-[14px] font-bold text-[#1E293B]">
                        {chat.name}
                      </span>
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

        <div className="flex h-[calc(100vh-150px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          {selectedChat ? (
            <div className="flex h-full min-h-0 flex-col justify-between">
              <div className="flex min-h-0 flex-1 flex-col">
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
                        disabled={handledBy !== "human"}
                        className="text-[11px] font-bold text-[#15803D] underline transition hover:text-[#14532D] disabled:opacity-40"
                      >
                        Gunakan Draf
                      </button>
                    </div>
                  </div>
                )}

                <div
                  ref={threadRef}
                  className="mt-6 flex-1 min-h-0 space-y-3.5 overflow-y-auto pr-2"
                >
                  {thread.length === 0 && (
                    <p className="py-8 text-center text-[12.5px] text-[#94A3B8]">
                      Belum ada pesan pada sesi ini.
                    </p>
                  )}

                  {thread.map((msg) => (
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

              {note && (
                <p className="mt-3 text-[11.5px] text-[#64748B]">{note}</p>
              )}

              <div className="mt-4 border-t border-[#F1F5F9] pt-4">
                {handledBy === "ai" ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12.5px] text-[#64748B]">
                      Dibalas otomatis oleh AI.
                    </p>
                    <button
                      type="button"
                      onClick={() => setHandover("human")}
                      disabled={busyAction}
                      className="flex h-10 items-center gap-1.5 rounded-xl bg-[#1D2B4D] px-4 text-[13px] font-semibold text-white transition hover:bg-[#25395F] disabled:opacity-40"
                    >
                      <Hand className="size-3.5 text-[#FFD11A]" />
                      Ambil Alih
                    </button>
                  </div>
                ) : (
                  <>
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
                        disabled={busyAction || !reply.trim()}
                        className="flex h-10 items-center gap-1.5 rounded-xl bg-[#1D2B4D] px-4 text-[13px] font-semibold text-white transition hover:bg-[#25395F] disabled:opacity-40"
                      >
                        <Send className="size-3.5 text-[#FFD11A]" />
                        Kirim
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHandover("ai")}
                      disabled={busyAction}
                      className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-[#94A3B8] transition hover:text-[#1D2B4D] disabled:opacity-40"
                    >
                      <RotateCcw className="size-3" />
                      Kembalikan ke AI
                    </button>
                  </>
                )}
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