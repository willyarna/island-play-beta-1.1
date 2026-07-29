import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, hashToken, sessionCookieName } from "@/lib/security";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${sessionCookieName}=([^;]+)`))?.[1];
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(decodeURIComponent(token)) } });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
