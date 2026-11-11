import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const webhook = process.env.NEXT_PUBLIC_N8N_DOCUSYNC_URL;

    if (!webhook) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_N8N_DOCUSYNC_URL belum diisi di .env.local" },
        { status: 400 }
      );
    }

    // Server Next.js yang mengirim ke n8n (Server-ke-Server 100% BEBAS CORS)
    const n8nRes = await fetch(webhook, {
      method: "POST",
      body: formData,
    });

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: `n8n mengembalikan status ${n8nRes.status}` },
        { status: n8nRes.status }
      );
    }

    const data = await n8nRes.json().catch(() => ({}));
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Gagal menghubungi server n8n" },
      { status: 500 }
    );
  }
}