import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 1. Uji INSERT (meniru yang akan dilakukan halaman saat upload)
const { data: inserted, error: insertError } = await supabase
  .from("doc_processing_runs")
  .insert({
    file_name: "uji-koneksi-docusync.txt",
    storage_path: null,
    status: "processing",
  })
  .select()
  .single();

console.log("=== INSERT ===");
console.log("Error:", insertError);
console.log("Baris:", inserted);

// 2. Uji SELECT (meniru yang akan dilakukan History Chat)
const { data, error, status } = await supabase
  .from("doc_processing_runs")
  .select("id, file_name, status, result_summary, created_at")
  .order("created_at", { ascending: false })
  .limit(5);

console.log("\n=== SELECT ===");
console.log("HTTP status:", status);
console.log("Error:", error);
console.log("Jumlah baris:", data?.length);
console.log("Data:", data);