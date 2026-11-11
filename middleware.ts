import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const isLoginPage = request.nextUrl.pathname === "/login";
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

  // Belum login → paksa ke /login (inilah yang membuat login jadi halaman pertama)
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sudah login tapi bukan akun admin → tolak
  if (user && adminEmail && user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
  }

  // Sudah login sebagai admin → tidak perlu lihat /login lagi
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};