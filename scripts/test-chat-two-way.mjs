import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SESSION = "test-session-001";

const { error: e1 } = await supabase.from("chat_messages").insert({
  session_id: SESSION,
  sender: "customer",
  message: "halo tes chat dua arah",
});
console.log("1. insert pesan customer:", e1 ? e1.message : "OK");

const { error: e2 } = await supabase
  .from("chat_handover")
  .upsert({ session_id: SESSION, handled_by: "ai" });
console.log("2. upsert status sesi:", e2 ? e2.message : "OK");

const { data, error: e3 } = await supabase
  .from("chat_messages")
  .select("*")
  .eq("session_id", SESSION);
console.log("3. baca pesan:", e3 ? e3.message : JSON.stringify(data));

const { error: e4 } = await supabase
  .from("chat_handover")
  .update({ handled_by: "human" })
  .eq("session_id", SESSION);
console.log("4. ambil alih:", e4 ? e4.message : "OK");

const { data: h } = await supabase
  .from("chat_handover")
  .select("*")
  .eq("session_id", SESSION)
  .single();
console.log("5. status sekarang:", h);