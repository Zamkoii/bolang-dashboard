"use client";

import { useState } from "react";
import { Phone, ShoppingCart } from "lucide-react";

type Material = { label: string; value: number; safeStock: number };
type Kind = "po" | "vendor";

const ENDPOINTS: Record<Kind, string | undefined> = {
  po: process.env.NEXT_PUBLIC_N8N_SUPPLYMIND_PO_URL,
  vendor: process.env.NEXT_PUBLIC_N8N_SUPPLYMIND_VENDOR_URL,
};

export default function SupplyMindActions({
  criticalMaterials,
  totalShortage,
}: {
  criticalMaterials: Material[];
  totalShortage: number;
}) {
  const [sending, setSending] = useState<Kind | null>(null);
  const [note, setNote] = useState("");

  async function send(kind: Kind) {
    const url = ENDPOINTS[kind];
    if (!url) {
      setNote("URL webhook n8n belum diisi di .env.local");
      return;
    }

    setSending(kind);
    setNote("");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: kind,
          totalShortage,
          materials: criticalMaterials.map((m) => ({
            name: m.label,
            currentStock: m.value,
            minimumStock: m.safeStock,
            shortage: m.safeStock - m.value,
          })),
          requestedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNote(kind === "po" ? "PO otomatis terkirim." : "Permintaan vendor terkirim.");
    } catch (err) {
      setNote(`Gagal: ${(err as Error).message}`);
    } finally {
      setSending(null);
    }
  }

  const noShortage = criticalMaterials.length === 0;

  return (
    <div className="mt-6 flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => send("po")}
        disabled={noShortage || sending !== null}
        title={noShortage ? "Semua stok di atas batas aman" : undefined}
        className="flex h-9 items-center gap-2 rounded-lg bg-[#F97316] px-[18px] text-[13px] font-semibold text-white transition hover:bg-[#EA6A0B] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart className="size-4" strokeWidth={2} />
        Buat PO Otomatis
      </button>

      <button
        type="button"
        onClick={() => send("vendor")}
        disabled={noShortage || sending !== null}
        title={noShortage ? "Semua stok di atas batas aman" : undefined}
        className="ml-3.5 flex items-center gap-1.5 text-[13px] font-medium text-[#F97316] transition hover:text-[#EA6A0B] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Phone className="size-[14px]" strokeWidth={2} />
        Hubungi Vendor
      </button>

      {note && <p className="text-[12px] text-[#6B7280]">{note}</p>}
    </div>
  );
}