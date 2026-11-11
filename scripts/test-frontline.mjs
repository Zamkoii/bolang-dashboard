import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error, status } = await supabase
  .from("customer_chats")
  .select("id, session_id, customer_name, category, question, created_at")
  .order("created_at", { ascending: false })
  .limit(5);

console.log("HTTP status:", status);
console.log("Error:", error);
console.log("Jumlah baris:", data?.length);
console.log("Data:", data);