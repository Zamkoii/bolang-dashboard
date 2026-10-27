"use server";

type MaterialPayload = {
  name: string;
  currentStock: number;
  minimumStock: number;
  shortage: number;
};

type StockPayload = {
  totalShortage: number;
  materials: MaterialPayload[];
  requestedAt: string;
};

async function postJson(webhook: string, payload: StockPayload) {
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `n8n mengembalikan status HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message || "Gagal menghubungi server n8n" };
  }
}

export async function runStockAnalysis(payload: StockPayload) {
  const webhook = process.env.NEXT_PUBLIC_N8N_SUPPLYMIND_ANALYSIS_URL;
  if (!webhook) {
    return { ok: false, error: "URL webhook analisis belum diisi di .env.local" };
  }
  return postJson(webhook, { action: "analyze", ...payload });
}

export async function submitFinanceRequest(payload: StockPayload) {
  const webhook = process.env.NEXT_PUBLIC_N8N_SUPPLYMIND_FINANCE_URL;
  if (!webhook) {
    return { ok: false, error: "URL webhook finance belum diisi di .env.local" };
  }
  return postJson(webhook, { action: "finance", ...payload });
}