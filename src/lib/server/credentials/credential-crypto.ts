import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";

import type { KeyProvider } from "./key-provider";

export const CREDENTIAL_FORMAT_VERSION = "format-v1" as const;
export const CREDENTIAL_ALGORITHM = "aes-256-gcm" as const;

const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const AUTHENTICATION_TAG_BYTES = 16;
const MAX_PLAINTEXT_BYTES = 64 * 1024;
const MAX_ENCRYPTED_PAYLOAD_BYTES = 128 * 1024;

type CredentialContext = {
  recordType: string;
  recordId: string;
  fieldName: string;
};

export type EncryptCredentialInput = CredentialContext & {
  plaintext: string;
  keyProvider: KeyProvider;
};

export type EncryptCredentialResult = {
  encryptedPayload: string;
  keyVersion: string;
};

export type DecryptCredentialInput = CredentialContext & EncryptCredentialResult & {
  keyProvider: KeyProvider;
};

type CredentialPayloadV1 = {
  formatVersion: typeof CREDENTIAL_FORMAT_VERSION;
  algorithm: typeof CREDENTIAL_ALGORITHM;
  nonce: string;
  ciphertext: string;
  authenticationTag: string;
};

export type CredentialCryptoErrorCode =
  | "INVALID_PLAINTEXT"
  | "INVALID_CONTEXT"
  | "INVALID_KEY_VERSION"
  | "UNKNOWN_KEY_VERSION"
  | "INVALID_KEY"
  | "KEY_PROVIDER_FAILURE"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_FORMAT"
  | "UNSUPPORTED_ALGORITHM"
  | "ENCRYPTION_FAILED"
  | "DECRYPTION_FAILED";

const ERROR_MESSAGES: Readonly<Record<CredentialCryptoErrorCode, string>> = {
  INVALID_PLAINTEXT: "El plaintext de la credencial no es válido.",
  INVALID_CONTEXT: "El contexto criptográfico no es válido.",
  INVALID_KEY_VERSION: "La versión de clave no es válida.",
  UNKNOWN_KEY_VERSION: "La versión de clave no está disponible.",
  INVALID_KEY: "La clave criptográfica no es válida.",
  KEY_PROVIDER_FAILURE: "No fue posible resolver la clave criptográfica.",
  INVALID_PAYLOAD: "El payload cifrado no es válido.",
  UNSUPPORTED_FORMAT: "La versión del payload cifrado no es compatible.",
  UNSUPPORTED_ALGORITHM: "El algoritmo del payload cifrado no es compatible.",
  ENCRYPTION_FAILED: "No fue posible cifrar la credencial.",
  DECRYPTION_FAILED: "No fue posible descifrar la credencial."
};

export class CredentialCryptoError extends Error {
  constructor(readonly code: CredentialCryptoErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "CredentialCryptoError";
  }
}

function assertPlaintext(plaintext: unknown): asserts plaintext is string {
  if (
    typeof plaintext !== "string" ||
    plaintext.length === 0 ||
    Buffer.byteLength(plaintext, "utf8") > MAX_PLAINTEXT_BYTES
  ) {
    throw new CredentialCryptoError("INVALID_PLAINTEXT");
  }
}

function assertContext(context: CredentialContext) {
  for (const value of [context.recordType, context.recordId, context.fieldName]) {
    if (typeof value !== "string" || value.length === 0) {
      throw new CredentialCryptoError("INVALID_CONTEXT");
    }
  }
}

function assertKeyVersion(keyVersion: unknown): asserts keyVersion is string {
  if (typeof keyVersion !== "string" || keyVersion.length === 0) {
    throw new CredentialCryptoError("INVALID_KEY_VERSION");
  }
}

async function resolveKey(keyProvider: KeyProvider, keyVersion: string) {
  let key: Uint8Array | undefined;

  try {
    key = await keyProvider.getKey(keyVersion);
  } catch {
    throw new CredentialCryptoError("KEY_PROVIDER_FAILURE");
  }

  if (key === undefined) {
    throw new CredentialCryptoError("UNKNOWN_KEY_VERSION");
  }

  if (!(key instanceof Uint8Array) || key.byteLength !== KEY_BYTES) {
    throw new CredentialCryptoError("INVALID_KEY");
  }

  return Buffer.from(key);
}

async function resolveActiveKeyVersion(keyProvider: KeyProvider) {
  let keyVersion: string;

  try {
    keyVersion = await keyProvider.getActiveKeyVersion();
  } catch {
    throw new CredentialCryptoError("KEY_PROVIDER_FAILURE");
  }

  assertKeyVersion(keyVersion);
  return keyVersion;
}

function buildAad(context: CredentialContext, keyVersion: string) {
  return Buffer.from(JSON.stringify({
    recordType: context.recordType,
    recordId: context.recordId,
    fieldName: context.fieldName,
    formatVersion: CREDENTIAL_FORMAT_VERSION,
    keyVersion
  }), "utf8");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactPayloadKeys(value: Record<string, unknown>) {
  const expectedKeys = [
    "algorithm",
    "authenticationTag",
    "ciphertext",
    "formatVersion",
    "nonce"
  ];
  return Object.keys(value).sort().join("\u0000") === expectedKeys.join("\u0000");
}

function decodeCanonicalBase64Url(value: unknown, expectedBytes?: number) {
  if (typeof value !== "string" || value.length === 0 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }

  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value || (expectedBytes !== undefined && decoded.byteLength !== expectedBytes)) {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }

  return decoded;
}

function parsePayload(encryptedPayload: unknown) {
  if (
    typeof encryptedPayload !== "string" ||
    encryptedPayload.length === 0 ||
    Buffer.byteLength(encryptedPayload, "utf8") > MAX_ENCRYPTED_PAYLOAD_BYTES
  ) {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(encryptedPayload);
  } catch {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }

  if (!isPlainObject(parsed) || !hasExactPayloadKeys(parsed)) {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }

  if (typeof parsed.formatVersion !== "string") {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }
  if (parsed.formatVersion !== CREDENTIAL_FORMAT_VERSION) {
    throw new CredentialCryptoError("UNSUPPORTED_FORMAT");
  }

  if (typeof parsed.algorithm !== "string") {
    throw new CredentialCryptoError("INVALID_PAYLOAD");
  }
  if (parsed.algorithm !== CREDENTIAL_ALGORITHM) {
    throw new CredentialCryptoError("UNSUPPORTED_ALGORITHM");
  }

  const nonce = decodeCanonicalBase64Url(parsed.nonce, NONCE_BYTES);
  const ciphertext = decodeCanonicalBase64Url(parsed.ciphertext);
  const authenticationTag = decodeCanonicalBase64Url(parsed.authenticationTag, AUTHENTICATION_TAG_BYTES);

  return { nonce, ciphertext, authenticationTag };
}

export async function encryptCredential({
  plaintext,
  recordType,
  recordId,
  fieldName,
  keyProvider
}: EncryptCredentialInput): Promise<EncryptCredentialResult> {
  assertPlaintext(plaintext);
  const context = { recordType, recordId, fieldName };
  assertContext(context);

  const keyVersion = await resolveActiveKeyVersion(keyProvider);
  const key = await resolveKey(keyProvider, keyVersion);

  try {
    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv(CREDENTIAL_ALGORITHM, key, nonce, {
      authTagLength: AUTHENTICATION_TAG_BYTES
    });
    cipher.setAAD(buildAad(context, keyVersion));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final()
    ]);
    const authenticationTag = cipher.getAuthTag();
    const payload: CredentialPayloadV1 = {
      formatVersion: CREDENTIAL_FORMAT_VERSION,
      algorithm: CREDENTIAL_ALGORITHM,
      nonce: nonce.toString("base64url"),
      ciphertext: ciphertext.toString("base64url"),
      authenticationTag: authenticationTag.toString("base64url")
    };

    return {
      encryptedPayload: JSON.stringify(payload),
      keyVersion
    };
  } catch {
    throw new CredentialCryptoError("ENCRYPTION_FAILED");
  }
}

export async function decryptCredential({
  encryptedPayload,
  keyVersion,
  recordType,
  recordId,
  fieldName,
  keyProvider
}: DecryptCredentialInput): Promise<string> {
  const context = { recordType, recordId, fieldName };
  assertContext(context);
  assertKeyVersion(keyVersion);

  const { nonce, ciphertext, authenticationTag } = parsePayload(encryptedPayload);
  const key = await resolveKey(keyProvider, keyVersion);

  try {
    const decipher = createDecipheriv(CREDENTIAL_ALGORITHM, key, nonce, {
      authTagLength: AUTHENTICATION_TAG_BYTES
    });
    decipher.setAAD(buildAad(context, keyVersion));
    decipher.setAuthTag(authenticationTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]).toString("utf8");
    assertPlaintext(plaintext);
    return plaintext;
  } catch {
    throw new CredentialCryptoError("DECRYPTION_FAILED");
  }
}
