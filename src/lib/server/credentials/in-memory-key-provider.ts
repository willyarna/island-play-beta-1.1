import "server-only";

import type { KeyProvider } from "./key-provider";

export type InMemoryKeyProviderOptions = {
  activeKeyVersion: string;
  keys: Readonly<Record<string, Uint8Array>>;
};

export class InMemoryKeyProvider implements KeyProvider {
  readonly #activeKeyVersion: string;
  readonly #keys: ReadonlyMap<string, Uint8Array>;

  constructor({ activeKeyVersion, keys }: InMemoryKeyProviderOptions) {
    this.#activeKeyVersion = activeKeyVersion;
    this.#keys = new Map(Object.entries(keys).map(([version, key]) => [version, new Uint8Array(key)]));
  }

  async getActiveKeyVersion() {
    return this.#activeKeyVersion;
  }

  async getKey(keyVersion: string) {
    const key = this.#keys.get(keyVersion);
    return key ? new Uint8Array(key) : undefined;
  }
}
