"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { runStockAnalysis } from "./actions";

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

      // Perbarui query Server Component agar data grafik & AI Insights ter-refresh
      router.refresh();
      setNote(result.message ?? "Analisis ulang berhasil dikirim ke AI Agent.");
    } catch (err) {
      setNote(`Gagal: ${(err as Error).message}`);
    } finally {
      setAnalyzing(false);
    }
  }

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

      {note && <p className="text-[12px] text-[#6B7280]">{note}</p>}
    </div>
  );
}