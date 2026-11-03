"use server";

export async function uploadDocToN8n(formData: FormData) {
  try {
    const webhook = process.env.NEXT_PUBLIC_N8N_DOCUSYNC_URL;

    if (!webhook) {
      return {
        ok: true,
        mock: true,
        message: "NEXT_PUBLIC_N8N_DOCUSYNC_URL belum diisi di .env.local",
        data: null,
      };
    }

    const n8nRes = await fetch(webhook, { method: "POST", body: formData });

    if (!n8nRes.ok) {
      return {
        ok: false,
        error: `n8n mengembalikan status HTTP ${n8nRes.status}`,
      };
    }

    const data = await n8nRes.json().catch(() => null);
    return { ok: true, mock: false, data };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message || "Gagal menghubungi server n8n",
    };
  }
}

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function chatWithDocuments(payload: {
  sessionId: string;
  question: string;
  runId: string | null;
  fileName: string | null;
  history: ChatTurn[];
}) {
  const webhook = process.env.NEXT_PUBLIC_N8N_DOCUSYNC_CHAT_URL;

  if (!webhook) {
    return {
      ok: false,
      error: "URL webhook chat DocuSync belum diisi di .env.local",
    };
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: payload.sessionId,
        question: payload.question,
        chat_input: payload.question,
        message: payload.question,
        text: payload.question,
        run_id: payload.runId,
        file_name: payload.fileName,
        history: payload.history,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `n8n mengembalikan status HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    const rawItem = Array.isArray(data) ? data[0] : data;

    // Menangkap key 'message', 'reply', 'output', dll.
    const reply =
      rawItem?.message ??
      rawItem?.reply ??
      rawItem?.output ??
      rawItem?.answer ??
      rawItem?.text ??
      rawItem?.response;

    const PLACEHOLDER =
      /workflow (was|has been) started|workflow executed|no output|empty/i;

    if (!reply || PLACEHOLDER.test(String(reply))) {
      return {
        ok: false,
        error: `Balasan n8n tidak berisi teks. Respons asli: ${JSON.stringify(
          rawItem ?? data
        ).slice(0, 200)}`,
      };
    }

    return { ok: true, reply: String(reply) };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message || "Gagal menghubungi server n8n",
    };
  }
}