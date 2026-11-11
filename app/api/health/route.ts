
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const { error } = await supabaseServer
    .from("raw_materials")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase query error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return NextResponse.json(
      {
        ok: false,
        message: "Query Supabase gagal.",
        code: error.code,
        error: error.message,
        details: error.details,
        hint: error.hint,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Bolang terhubung ke Supabase.",
  });
}
