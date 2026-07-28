import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/admin", "/kitchen", "/waiter"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = token.role as string;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    if (role === "KITCHEN") return NextResponse.redirect(new URL("/kitchen", request.url));
    if (role === "WAITER") return NextResponse.redirect(new URL("/waiter", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/kitchen") && !["ADMIN", "KITCHEN"].includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/waiter") && !["ADMIN", "WAITER", "STAFF"].includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*", "/waiter/:path*"],
};
