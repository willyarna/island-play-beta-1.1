import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logSafeError } from "@/lib/server/observability/safe-error-logger";

export function jsonOk<T>(data: T) {
  return NextResponse.json(data);
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", issues: error.issues }, { status: 400 });
  }

  logSafeError(error, "API_REQUEST");
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function readJson<T>(request: Request) {
  return (await request.json()) as T;
}
