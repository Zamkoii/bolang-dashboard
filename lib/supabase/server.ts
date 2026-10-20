import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.url_supabase;
const supabaseAnonKey = process.env.anon_supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL atau anon key belum dikonfigurasi."
  );
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);