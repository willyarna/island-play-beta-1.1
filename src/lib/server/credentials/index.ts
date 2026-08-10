import "server-only";

export {
  CREDENTIAL_ALGORITHM,
  CREDENTIAL_FORMAT_VERSION,
  CredentialCryptoError,
  decryptCredential,
  encryptCredential
} from "./credential-crypto";
export type {
  CredentialCryptoErrorCode,
  DecryptCredentialInput,
  EncryptCredentialInput,
  EncryptCredentialResult
} from "./credential-crypto";
export {
  EnvironmentKeyProvider,
  EnvironmentKeyProviderError
} from "./environment-key-provider";
export type {
  EnvironmentKeyProviderErrorCode,
  EnvironmentKeySource
} from "./environment-key-provider";
export {
  normalizeProfilePin,
  prepareAccountPasswordDualWrite,
  prepareCreatedAccountCredentialDualWrites,
  prepareProfilePinDualWrite,
  protectCreatedAccountCredentials
} from "./credential-dual-write";
export type {
  AccountPasswordDualWrite,
  ProfilePinDualWrite
} from "./credential-dual-write";
export { getCredentialKeyProvider } from "./runtime-key-provider";
export type { KeyProvider } from "./key-provider";
