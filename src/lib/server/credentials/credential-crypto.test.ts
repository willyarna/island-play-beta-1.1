import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import {
  CREDENTIAL_ALGORITHM,
  CREDENTIAL_FORMAT_VERSION,
  CredentialCryptoError,
  decryptCredential,
  encryptCredential
} from "./credential-crypto";
import { InMemoryKeyProvider } from "./in-memory-key-provider";
import type { KeyProvider } from "./key-provider";

const context = {
  recordType: "Account",
  recordId: "test-account-id",
  fieldName: "password"
};

function createProvider(activeKeyVersion = "v1", keys?: Readonly<Record<string, Uint8Array>>) {
  return new InMemoryKeyProvider({
    activeKeyVersion,
    keys: keys ?? { v1: randomBytes(32) }
  });
}

function parsePayload(encryptedPayload: string) {
  return JSON.parse(encryptedPayload) as {
    formatVersion: string;
    algorithm: string;
    nonce: string;
    ciphertext: string;
    authenticationTag: string;
  };
}

function mutateEncodedByte(value: string) {
  const bytes = Buffer.from(value, "base64url");
  bytes[0] ^= 1;
  return bytes.toString("base64url");
}

function hasCryptoCode(error: unknown, code: CredentialCryptoError["code"]) {
  return error instanceof CredentialCryptoError && error.code === code;
}

describe("contrato criptográfico de credenciales", () => {
  it("cifra y descifra el plaintext original", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });

    const plaintext = await decryptCredential({ ...encrypted, ...context, keyProvider });

    assert.equal(plaintext, "test-password");
    assert.equal(encrypted.keyVersion, "v1");
  });

  it("preserva tildes, ñ, emoji y caracteres no ASCII", async () => {
    const keyProvider = createProvider();
    const original = "Contraseña sintética: piñata, café, 🔐, 日本語";

    const encrypted = await encryptCredential({ plaintext: original, ...context, keyProvider });

    assert.equal(await decryptCredential({ ...encrypted, ...context, keyProvider }), original);
  });

  it("serializa un payload JSON explícito y versionado con Base64URL canónico", async () => {
    const encrypted = await encryptCredential({
      plaintext: "test-password",
      ...context,
      keyProvider: createProvider()
    });
    const payload = parsePayload(encrypted.encryptedPayload);

    assert.deepEqual(Object.keys(payload), [
      "formatVersion",
      "algorithm",
      "nonce",
      "ciphertext",
      "authenticationTag"
    ]);
    assert.equal(payload.formatVersion, CREDENTIAL_FORMAT_VERSION);
    assert.equal(payload.algorithm, CREDENTIAL_ALGORITHM);
    assert.match(payload.nonce, /^[A-Za-z0-9_-]+$/);
    assert.match(payload.ciphertext, /^[A-Za-z0-9_-]+$/);
    assert.match(payload.authenticationTag, /^[A-Za-z0-9_-]+$/);
    assert.equal(Buffer.from(payload.nonce, "base64url").byteLength, 12);
    assert.equal(Buffer.from(payload.authenticationTag, "base64url").byteLength, 16);
  });

  it("produce payloads distintos al cifrar dos veces el mismo plaintext", async () => {
    const keyProvider = createProvider();

    const first = await encryptCredential({ plaintext: "same-test-value", ...context, keyProvider });
    const second = await encryptCredential({ plaintext: "same-test-value", ...context, keyProvider });

    assert.notEqual(first.encryptedPayload, second.encryptedPayload);
    assert.notEqual(parsePayload(first.encryptedPayload).nonce, parsePayload(second.encryptedPayload).nonce);
  });

  it("falla con una clave incorrecta", async () => {
    const encrypted = await encryptCredential({
      plaintext: "test-password",
      ...context,
      keyProvider: createProvider("v1", { v1: randomBytes(32) })
    });
    const wrongProvider = createProvider("v1", { v1: randomBytes(32) });

    await assert.rejects(
      decryptCredential({ ...encrypted, ...context, keyProvider: wrongProvider }),
      (error) => hasCryptoCode(error, "DECRYPTION_FAILED")
    );
  });

  it("falla con una keyVersion inexistente", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });

    await assert.rejects(
      decryptCredential({ ...encrypted, keyVersion: "missing", ...context, keyProvider }),
      (error) => hasCryptoCode(error, "UNKNOWN_KEY_VERSION")
    );
  });

  it("autentica keyVersion aunque dos versiones compartan el mismo material de clave", async () => {
    const sharedKey = randomBytes(32);
    const keyProvider = createProvider("v1", { v1: sharedKey, v2: sharedKey });
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });

    assert.equal(encrypted.keyVersion, "v1");
    await assert.rejects(
      decryptCredential({ ...encrypted, keyVersion: "v2", ...context, keyProvider }),
      (error) => hasCryptoCode(error, "DECRYPTION_FAILED")
    );
  });

  it("falla si cambia el ciphertext", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });
    const payload = parsePayload(encrypted.encryptedPayload);
    payload.ciphertext = mutateEncodedByte(payload.ciphertext);

    await assert.rejects(
      decryptCredential({ ...encrypted, encryptedPayload: JSON.stringify(payload), ...context, keyProvider }),
      (error) => hasCryptoCode(error, "DECRYPTION_FAILED")
    );
  });

  it("falla si cambia el nonce", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });
    const payload = parsePayload(encrypted.encryptedPayload);
    payload.nonce = mutateEncodedByte(payload.nonce);

    await assert.rejects(
      decryptCredential({ ...encrypted, encryptedPayload: JSON.stringify(payload), ...context, keyProvider }),
      (error) => hasCryptoCode(error, "DECRYPTION_FAILED")
    );
  });

  it("falla si cambia el authentication tag", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });
    const payload = parsePayload(encrypted.encryptedPayload);
    payload.authenticationTag = mutateEncodedByte(payload.authenticationTag);

    await assert.rejects(
      decryptCredential({ ...encrypted, encryptedPayload: JSON.stringify(payload), ...context, keyProvider }),
      (error) => hasCryptoCode(error, "DECRYPTION_FAILED")
    );
  });

  for (const [field, changedValue] of [
    ["recordType", "Profile"],
    ["recordId", "other-test-account-id"],
    ["fieldName", "pin"]
  ] as const) {
    it(`falla si cambia el contexto AAD ${field}`, async () => {
      const keyProvider = createProvider();
      const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });

      await assert.rejects(
        decryptCredential({
          ...encrypted,
          ...context,
          [field]: changedValue,
          keyProvider
        }),
        (error) => hasCryptoCode(error, "DECRYPTION_FAILED")
      );
    });
  }

  it("falla con formatVersion desconocida", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });
    const payload = parsePayload(encrypted.encryptedPayload);
    payload.formatVersion = "format-v999";

    await assert.rejects(
      decryptCredential({ ...encrypted, encryptedPayload: JSON.stringify(payload), ...context, keyProvider }),
      (error) => hasCryptoCode(error, "UNSUPPORTED_FORMAT")
    );
  });

  it("falla con algoritmo desconocido", async () => {
    const keyProvider = createProvider();
    const encrypted = await encryptCredential({ plaintext: "test-password", ...context, keyProvider });
    const payload = parsePayload(encrypted.encryptedPayload);
    payload.algorithm = "unknown-algorithm";

    await assert.rejects(
      decryptCredential({ ...encrypted, encryptedPayload: JSON.stringify(payload), ...context, keyProvider }),
      (error) => hasCryptoCode(error, "UNSUPPORTED_ALGORITHM")
    );
  });

  it("falla cerrado con payloads mal formados", async () => {
    const keyProvider = createProvider();
    const invalidPayloads = [
      "not-json",
      "[]",
      JSON.stringify({}),
      JSON.stringify({
        formatVersion: CREDENTIAL_FORMAT_VERSION,
        algorithm: CREDENTIAL_ALGORITHM,
        nonce: 123,
        ciphertext: "AA",
        authenticationTag: "AA"
      }),
      JSON.stringify({
        formatVersion: CREDENTIAL_FORMAT_VERSION,
        algorithm: CREDENTIAL_ALGORITHM,
        nonce: "not+base64url",
        ciphertext: "AA",
        authenticationTag: "AA"
      }),
      JSON.stringify({
        formatVersion: CREDENTIAL_FORMAT_VERSION,
        algorithm: CREDENTIAL_ALGORITHM,
        nonce: randomBytes(11).toString("base64url"),
        ciphertext: randomBytes(8).toString("base64url"),
        authenticationTag: randomBytes(16).toString("base64url")
      }),
      JSON.stringify({
        formatVersion: CREDENTIAL_FORMAT_VERSION,
        algorithm: CREDENTIAL_ALGORITHM,
        nonce: randomBytes(12).toString("base64url"),
        ciphertext: randomBytes(8).toString("base64url"),
        authenticationTag: randomBytes(15).toString("base64url")
      }),
      JSON.stringify({
        formatVersion: CREDENTIAL_FORMAT_VERSION,
        algorithm: CREDENTIAL_ALGORITHM,
        nonce: randomBytes(12).toString("base64url"),
        ciphertext: randomBytes(8).toString("base64url"),
        authenticationTag: randomBytes(16).toString("base64url"),
        unexpected: true
      })
    ];

    for (const encryptedPayload of invalidPayloads) {
      await assert.rejects(
        decryptCredential({ encryptedPayload, keyVersion: "v1", ...context, keyProvider }),
        (error) => hasCryptoCode(error, "INVALID_PAYLOAD")
      );
    }
  });

  it("rechaza claves que no tienen exactamente 32 bytes", async () => {
    const invalidProvider: KeyProvider = {
      getActiveKeyVersion: async () => "v1",
      getKey: async () => randomBytes(31)
    };

    await assert.rejects(
      encryptCredential({ plaintext: "test-password", ...context, keyProvider: invalidProvider }),
      (error) => hasCryptoCode(error, "INVALID_KEY")
    );
  });

  it("mantiene lectura de v1 y cifra datos nuevos con la versión activa v2", async () => {
    const v1 = randomBytes(32);
    const v2 = randomBytes(32);
    const oldProvider = createProvider("v1", { v1 });
    const oldEncrypted = await encryptCredential({ plaintext: "old-test-password", ...context, keyProvider: oldProvider });
    const rotatedProvider = createProvider("v2", { v1, v2 });

    const oldPlaintext = await decryptCredential({ ...oldEncrypted, ...context, keyProvider: rotatedProvider });
    const newEncrypted = await encryptCredential({
      plaintext: "new-test-password",
      ...context,
      keyProvider: rotatedProvider
    });

    assert.equal(oldPlaintext, "old-test-password");
    assert.equal(newEncrypted.keyVersion, "v2");
    assert.equal(
      await decryptCredential({ ...newEncrypted, ...context, keyProvider: rotatedProvider }),
      "new-test-password"
    );
  });

  it("rechaza explícitamente plaintext vacío", async () => {
    await assert.rejects(
      encryptCredential({ plaintext: "", ...context, keyProvider: createProvider() }),
      (error) => hasCryptoCode(error, "INVALID_PLAINTEXT")
    );
  });

  it("cifra y descifra un plaintext largo razonable", async () => {
    const keyProvider = createProvider();
    const original = "credencial-sintética-🔐-".repeat(2_000);

    const encrypted = await encryptCredential({ plaintext: original, ...context, keyProvider });

    assert.equal(await decryptCredential({ ...encrypted, ...context, keyProvider }), original);
  });

  it("no expone plaintext, payload ni material de clave en errores", async () => {
    const plaintext = "secret-only-for-this-test";
    const correctKey = randomBytes(32);
    const wrongKey = randomBytes(32);
    const encrypted = await encryptCredential({
      plaintext,
      ...context,
      keyProvider: createProvider("v1", { v1: correctKey })
    });

    await assert.rejects(
      decryptCredential({
        ...encrypted,
        ...context,
        keyProvider: createProvider("v1", { v1: wrongKey })
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        const renderedError = `${error.name}: ${error.message}`;
        assert.equal(renderedError.includes(plaintext), false);
        assert.equal(renderedError.includes(encrypted.encryptedPayload), false);
        assert.equal(renderedError.includes(correctKey.toString("base64url")), false);
        assert.equal(renderedError.includes(wrongKey.toString("base64url")), false);
        return true;
      }
    );
  });
});
