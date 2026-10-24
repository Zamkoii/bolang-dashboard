import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error, status } = await supabase.rpc("get_frontline_conversations");

console.log("HTTP status:", status);
console.log("Error:", error);
console.log("Jumlah sesi:", data?.length);
console.log("Data:", data);