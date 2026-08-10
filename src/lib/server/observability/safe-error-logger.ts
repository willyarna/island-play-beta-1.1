import "server-only";

import { randomUUID } from "node:crypto";

export type SafeErrorContext = "API_REQUEST" | "DATABASE_SEED";
export type SafeErrorCategory = "APPLICATION_ERROR" | "PRISMA_ERROR" | "UNKNOWN_ERROR";

export type SafeErrorLog = {
  event: "application_error";
  incidentId: string;
  category: SafeErrorCategory;
  context: SafeErrorContext;
  prismaCode?: string;
};

function readSafePrismaCode(error: unknown) {
  if ((typeof error !== "object" && typeof error !== "function") || error === null) return undefined;

  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "code");
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") return undefined;
    return /^P\d{4}$/.test(descriptor.value) ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}

function isNativeError(error: unknown) {
  try {
    return error instanceof Error;
  } catch {
    return false;
  }
}

export function buildSafeErrorLog(error: unknown, context: SafeErrorContext): SafeErrorLog {
  const prismaCode = readSafePrismaCode(error);

  return {
    event: "application_error",
    incidentId: randomUUID(),
    category: prismaCode ? "PRISMA_ERROR" : isNativeError(error) ? "APPLICATION_ERROR" : "UNKNOWN_ERROR",
    context,
    ...(prismaCode ? { prismaCode } : {})
  };
}

export function logSafeError(error: unknown, context: SafeErrorContext) {
  const safeLog = buildSafeErrorLog(error, context);
  console.error(safeLog);
  return safeLog;
}
