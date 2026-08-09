import "server-only";

import type { KeyProvider } from "./key-provider";

const ACTIVE_KEY_VERSION_VARIABLE = "CREDENTIAL_KEY_ACTIVE_VERSION";
const KEY_VARIABLE_PREFIX = "CREDENTIAL_KEY_";
const KEY_BYTES = 32;
const KEY_VERSION_PATTERN = /^v[1-9][0-9]{0,8}$/;
const KEY_VARIABLE_PATTERN = /^CREDENTIAL_KEY_V([1-9][0-9]{0,8})_BASE64URL$/;
const CANONICAL_BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export type EnvironmentKeySource = Readonly<Record<string, string | undefined>>;

export type EnvironmentKeyProviderErrorCode =
  | "MISSING_ACTIVE_KEY_VERSION"
  | "INVALID_KEY_VERSION"
  | "MISSING_ACTIVE_KEY"
  | "INVALID_KEY_VARIABLE_NAME"
  | "INVALID_KEY_MATERIAL";

const ERROR_MESSAGES: Readonly<Record<EnvironmentKeyProviderErrorCode, string>> = {
  MISSING_ACTIVE_KEY_VERSION: "La versión activa de claves no está configurada.",
  INVALID_KEY_VERSION: "La versión de clave configurada no es válida.",
  MISSING_ACTIVE_KEY: "La clave activa no está configurada.",
  INVALID_KEY_VARIABLE_NAME: "El nombre de una variable de clave no es válido.",
  INVALID_KEY_MATERIAL: "El material de una clave configurada no es válido."
};

export class EnvironmentKeyProviderError extends Error {
  constructor(readonly code: EnvironmentKeyProviderErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "EnvironmentKeyProviderError";
  }
}

function assertKeyVersion(keyVersion: unknown): asserts keyVersion is string {
  if (typeof keyVersion !== "string" || !KEY_VERSION_PATTERN.test(keyVersion)) {
    throw new EnvironmentKeyProviderError("INVALID_KEY_VERSION");
  }
}

function decodeKeyMaterial(encodedKey: string) {
  if (!CANONICAL_BASE64URL_PATTERN.test(encodedKey)) {
    throw new EnvironmentKeyProviderError("INVALID_KEY_MATERIAL");
  }

  const decodedKey = Buffer.from(encodedKey, "base64url");
  if (decodedKey.byteLength !== KEY_BYTES || decodedKey.toString("base64url") !== encodedKey) {
    throw new EnvironmentKeyProviderError("INVALID_KEY_MATERIAL");
  }

  return new Uint8Array(decodedKey);
}

export class EnvironmentKeyProvider implements KeyProvider {
  readonly #activeKeyVersion: string;
  readonly #keys: ReadonlyMap<string, Uint8Array>;

  constructor(environment: EnvironmentKeySource) {
    const activeKeyVersion = environment[ACTIVE_KEY_VERSION_VARIABLE];
    if (activeKeyVersion === undefined) {
      throw new EnvironmentKeyProviderError("MISSING_ACTIVE_KEY_VERSION");
    }
    assertKeyVersion(activeKeyVersion);

    const keys = new Map<string, Uint8Array>();
    for (const [variableName, encodedKey] of Object.entries(environment)) {
      if (
        variableName === ACTIVE_KEY_VERSION_VARIABLE ||
        encodedKey === undefined ||
        !variableName.startsWith(KEY_VARIABLE_PREFIX)
      ) {
        continue;
      }

      const match = KEY_VARIABLE_PATTERN.exec(variableName);
      if (!match) {
        throw new EnvironmentKeyProviderError("INVALID_KEY_VARIABLE_NAME");
      }

      keys.set(`v${match[1]}`, decodeKeyMaterial(encodedKey));
    }

    if (!keys.has(activeKeyVersion)) {
      throw new EnvironmentKeyProviderError("MISSING_ACTIVE_KEY");
    }

    this.#activeKeyVersion = activeKeyVersion;
    this.#keys = keys;
  }

  async getActiveKeyVersion() {
    return this.#activeKeyVersion;
  }

  async getKey(keyVersion: string) {
    assertKeyVersion(keyVersion);
    const key = this.#keys.get(keyVersion);
    return key ? new Uint8Array(key) : undefined;
  }
}
