import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireAuth(roles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: jsonError("Unauthorized", 401), session: null };
  }
  if (roles && !roles.includes(session.user.role)) {
    return { error: jsonError("Forbidden", 403), session: null };
  }
  return { error: null, session };
}
