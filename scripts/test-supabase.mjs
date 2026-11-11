import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Memeriksa environment...");
console.log("URL:", supabaseUrl ? "Tersedia" : "KOSONG / UNDEFINED");
console.log("Anon Key:", supabaseAnonKey ? "Tersedia" : "KOSONG / UNDEFINED");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Environment belum terbaca dari .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("\nMenjalankan query ke tabel 'raw_materials'...");
const { data, error, status, statusText } = await supabase
  .from("raw_materials")
  .select("id, name, current_stock")
  .limit(5);

console.log("HTTP status:", status, statusText);
console.log("Error:", error);
console.log("Jumlah data:", data?.length);
console.log("Data:", data);