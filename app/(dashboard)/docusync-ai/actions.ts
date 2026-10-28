"use server";

export async function uploadDocToN8n(formData: FormData) {
  try {
    const webhook = process.env.NEXT_PUBLIC_N8N_DOCUSYNC_URL;

    if (!webhook) {
      return {
        ok: true,
        mock: true,
        message: "NEXT_PUBLIC_N8N_DOCUSYNC_URL belum diisi di .env.local",
      };
    }

    // Dikirim dari server Next.js langsung ke n8n (bebas CORS)
    const n8nRes = await fetch(webhook, {
      method: "POST",
      body: formData,
    });

    if (!n8nRes.ok) {
      return {
        ok: false,
        error: `n8n mengembalikan status HTTP ${n8nRes.status}`,
      };
    }

    const data = await n8nRes.json().catch(() => ({}));
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message || "Gagal menghubungi server n8n",
    };
  }
}
