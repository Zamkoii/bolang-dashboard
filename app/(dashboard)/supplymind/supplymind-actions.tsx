"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Mail } from "lucide-react";
import { runStockAnalysis, submitFinanceRequest } from "./actions";

type Material = { label: string; value: number; safeStock: number };

export default function SupplyMindActions({
  criticalMaterials,
  totalShortage,
}: {
  criticalMaterials: Material[];
  totalShortage: number;
}) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");

  function buildPayload() {
    return {
      totalShortage,
      materials: criticalMaterials.map((m) => ({
        name: m.label,
        currentStock: m.value,
        minimumStock: m.safeStock,
        shortage: m.safeStock - m.value,
      })),
      requestedAt: new Date().toISOString(),
    };
  }

  async function reanalyze() {
    setAnalyzing(true);
    setNote("");

    try {
      const result = await runStockAnalysis(buildPayload());

      if (!result.ok) {
        throw new Error(result.error || "Gagal mengirim permintaan analisis");
      }

      // Sinkronkan grafik & AI Insights dengan data terbaru dari Supabase
      router.refresh();
      setNote("Analisis ulang dikirim ke AI Agent.");
    } catch (err) {
      setNote(`Gagal: ${(err as Error).message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendToFinance() {
    setSending(true);
    setNote("");

    try {
      const result = await submitFinanceRequest(buildPayload());

      if (!result.ok) {
        throw new Error(result.error || "Gagal mengirim pengajuan");
      }

      setNote("Pengajuan terkirim ke finance.");
    } catch (err) {
      setNote(`Gagal: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  const noShortage = criticalMaterials.length === 0;

  return (
    <div className="mt-6 flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={reanalyze}
        disabled={analyzing}
        className="flex h-9 items-center gap-2 rounded-lg bg-[#F97316] px-[18px] text-[13px] font-semibold text-white transition hover:bg-[#EA6A0B] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw
          className={`size-4 ${analyzing ? "animate-spin" : ""}`}
          strokeWidth={2}
        />
        Analisis Ulang Stok
      </button>

      <button
        type="button"
        onClick={sendToFinance}
        disabled={noShortage || sending}
        title={noShortage ? "Semua stok di atas batas aman" : undefined}
        className="ml-3.5 flex items-center gap-1.5 text-[13px] font-medium text-[#F97316] transition hover:text-[#EA6A0B] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mail className="size-[14px]" strokeWidth={2} />
        Ajukan ke Finance
      </button>

      {note && <p className="text-[12px] text-[#6B7280]">{note}</p>}
    </div>
  );
}