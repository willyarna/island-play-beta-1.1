import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await readJson(request));
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, accessUntil: user.accessUntil }
    });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
