import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSafeErrorLog, logSafeError } from "./safe-error-logger";

const secrets = [
  "TEST_PASSWORD_SECRET",
  "TEST_PIN_SECRET",
  "TEST_CIPHERTEXT_SECRET",
  "TEST_KEY_MATERIAL_SECRET"
] as const;

function createSecretBearingError() {
  const error = new Error(`Falló con ${secrets[0]}`) as Error & {
    cause?: unknown;
    meta?: unknown;
  };
  error.stack = `SyntheticStack: ${secrets[1]}`;
  error.cause = new Error(secrets[2]);
  error.meta = {
    query: `UPDATE credentials SET payload = '${secrets[2]}'`,
    arguments: { key: secrets[3] }
  };
  return error;
}

function assertSecretsAbsent(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const secret of secrets) {
    assert.equal(serialized.includes(secret), false, `${secret} no debe aparecer en el log seguro`);
  }
  for (const forbiddenKey of ["message", "stack", "cause", "meta", "query", "arguments"]) {
    assert.equal(serialized.includes(forbiddenKey), false, `${forbiddenKey} no debe aparecer en el log seguro`);
  }
}

describe("safe error logger", () => {
  it("construye una salida allowlist sin message, stack, cause, meta ni secretos", () => {
    const safeLog = buildSafeErrorLog(createSecretBearingError(), "API_REQUEST");

    assert.deepEqual(Object.keys(safeLog).sort(), ["category", "context", "event", "incidentId"]);
    assert.equal(safeLog.event, "application_error");
    assert.equal(safeLog.category, "APPLICATION_ERROR");
    assert.equal(safeLog.context, "API_REQUEST");
    assert.match(safeLog.incidentId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assertSecretsAbsent(safeLog);
  });

  it("conserva únicamente un Prisma code Pxxxx válido", () => {
    const prismaErrorLike = {
      code: "P2002",
      message: secrets[0],
      stack: secrets[1],
      cause: secrets[2],
      meta: { target: secrets[3] }
    };

    const safeLog = buildSafeErrorLog(prismaErrorLike, "DATABASE_SEED");

    assert.deepEqual(Object.keys(safeLog).sort(), [
      "category",
      "context",
      "event",
      "incidentId",
      "prismaCode"
    ]);
    assert.equal(safeLog.category, "PRISMA_ERROR");
    assert.equal(safeLog.prismaCode, "P2002");
    assertSecretsAbsent(safeLog);
  });

  it("no serializa objetos arbitrarios ni conserva códigos no allowlisted", () => {
    const arbitraryErrorLike = {
      code: `P2002-${secrets[0]}`,
      nested: { password: secrets[0], pin: secrets[1] },
      toJSON: () => {
        throw new Error(secrets[2]);
      }
    };

    const safeLog = buildSafeErrorLog(arbitraryErrorLike, "API_REQUEST");

    assert.deepEqual(Object.keys(safeLog).sort(), ["category", "context", "event", "incidentId"]);
    assert.equal(safeLog.category, "UNKNOWN_ERROR");
    assertSecretsAbsent(safeLog);
  });

  it("logSafeError emite exclusivamente el objeto sanitizado", () => {
    const originalConsoleError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };

    try {
      const safeLog = logSafeError(createSecretBearingError(), "DATABASE_SEED");

      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0], [safeLog]);
      assertSecretsAbsent(calls);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
