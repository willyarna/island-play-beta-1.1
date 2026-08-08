export interface KeyProvider {
  getActiveKeyVersion(): Promise<string>;
  getKey(keyVersion: string): Promise<Uint8Array | undefined>;
}
