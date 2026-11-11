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

type WebhookPayload = StockPayload & { action: string };

const PLACEHOLDER =
  /workflow (was|has been) started|workflow executed|no output|empty/i;

function extractMessage(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return extractMessage(data[0]);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["message", "reply", "output", "answer", "text"]) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return null;
}

async function postJson(webhook: string, payload: WebhookPayload) {
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { ok: false as const, error: `n8n mengembalikan status HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => null);
    const message = extractMessage(data);

    if (message && PLACEHOLDER.test(message)) {
      return {
        ok: true as const,
        message: "Workflow dijalankan — hasil analisis akan dikirim ke email (Mailpit).",
      };
    }

    return { ok: true as const, message: message ?? undefined };
  } catch (err) {
    return {
      ok: false as const,
      error: (err as Error).message || "Gagal menghubungi server n8n",
    };
  }
}

export async function runStockAnalysis(payload: StockPayload) {
  const webhook = process.env.NEXT_PUBLIC_N8N_SUPPLYMIND_ANALYSIS_URL;
  if (!webhook) {
    return { ok: false as const, error: "URL webhook analisis belum diisi di .env.local" };
  }
  return postJson(webhook, { action: "analyze", ...payload });
}