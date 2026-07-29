import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T) {
  return NextResponse.json(data);
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", issues: error.issues }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export async function readJson<T>(request: Request) {
  return (await request.json()) as T;
}
