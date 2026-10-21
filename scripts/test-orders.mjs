import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

for (const table of ["orders", "order_items"]) {
  const { data, error, status } = await supabase.from(table).select("*").limit(2);

  console.log(`\n=== ${table} ===`);
  console.log("HTTP status:", status);
  console.log("Error:", error);
  console.log("Jumlah data:", data?.length);
  console.log("Kolom:", data?.[0] ? Object.keys(data[0]) : "(tidak ada baris)");
  console.log("Data:", data);
}