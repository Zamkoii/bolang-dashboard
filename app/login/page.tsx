"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");

    // Hanya satu akun admin yang diperbolehkan
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
    if (adminEmail && email.trim().toLowerCase() !== adminEmail) {
      setError("Akun ini tidak memiliki akses ke dashboard.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email atau password salah."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8FAFC] px-5">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {/* Logo Bolang */}
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#1D2B4D]">
            <Zap className="size-5 fill-[#FFD11A] text-[#FFD11A]" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-[#1D2B4D]">
            Bolang
          </span>
        </div>

        <h1 className="mt-6 text-[20px] font-bold text-[#111827]">
          Masuk ke Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Portal internal — hanya administrator yang dapat mengakses.
        </p>

        <form onSubmit={handleLogin} className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#374151]">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bolang.id"
                required
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] pl-10 pr-3 text-[13px] text-[#111827] outline-none transition focus:border-[#1D2B4D]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#374151]">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] pl-10 pr-3 text-[13px] text-[#111827] outline-none transition focus:border-[#1D2B4D]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1D2B4D] text-[13px] font-semibold text-[#FFD11A] transition hover:bg-[#25395F] disabled:opacity-50"
          >
            {loading ? "Memproses…" : "Masuk"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-[#9CA3AF]">
          Pendaftaran akun baru dinonaktifkan — hubungi administrator untuk akses.
        </p>
      </div>
    </div>
  );
}