import "server-only";

import { EnvironmentKeyProvider } from "./environment-key-provider";
import type { KeyProvider } from "./key-provider";

let cachedCredentialKeyProvider: KeyProvider | undefined;

export function getCredentialKeyProvider(): KeyProvider {
  if (!cachedCredentialKeyProvider) {
    cachedCredentialKeyProvider = new EnvironmentKeyProvider(process.env);
  }

  return cachedCredentialKeyProvider;
}
