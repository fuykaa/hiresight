import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/resume", "/analyze", "/profile"];
const authRoutes = ["/login", "/register"];

export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthPage  = authRoutes.some((r) => pathname.startsWith(r));

  // Sudah login → jangan akses login/register → redirect ke dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Belum login → jangan akses halaman protected → redirect ke login
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resume/:path*",
    "/analyze/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
