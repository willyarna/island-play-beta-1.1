import "server-only";

import type { Prisma } from "@prisma/client";

import { encryptCredential } from "./credential-crypto";
import type { KeyProvider } from "./key-provider";
import { getCredentialKeyProvider } from "./runtime-key-provider";

export type AccountPasswordDualWrite = {
  password: string;
  passwordEncryptedPayload: string;
  passwordKeyVersion: string;
};

export type ProfilePinDualWrite = {
  pin: string | null;
  pinEncryptedPayload: string | null;
  pinKeyVersion: string | null;
};

type CreatedProfileCredential = {
  id: string;
  pin: string | null | undefined;
};

export function normalizeProfilePin(pin: string | null | undefined): string | null {
  if (pin === null || pin === undefined) return null;

  const normalizedPin = pin.trim();
  return normalizedPin.length > 0 ? normalizedPin : null;
}

export async function prepareAccountPasswordDualWrite(input: {
  accountId: string;
  password: string;
  keyProvider?: KeyProvider;
}): Promise<AccountPasswordDualWrite> {
  const encrypted = await encryptCredential({
    plaintext: input.password,
    recordType: "Account",
    recordId: input.accountId,
    fieldName: "password",
    keyProvider: input.keyProvider ?? getCredentialKeyProvider()
  });

  return {
    password: input.password,
    passwordEncryptedPayload: encrypted.encryptedPayload,
    passwordKeyVersion: encrypted.keyVersion
  };
}

export async function prepareProfilePinDualWrite(input: {
  profileId: string;
  pin: string | null | undefined;
  keyProvider?: KeyProvider;
}): Promise<ProfilePinDualWrite> {
  const pin = normalizeProfilePin(input.pin);
  if (pin === null) {
    return {
      pin: null,
      pinEncryptedPayload: null,
      pinKeyVersion: null
    };
  }

  const encrypted = await encryptCredential({
    plaintext: pin,
    recordType: "Profile",
    recordId: input.profileId,
    fieldName: "pin",
    keyProvider: input.keyProvider ?? getCredentialKeyProvider()
  });

  return {
    pin,
    pinEncryptedPayload: encrypted.encryptedPayload,
    pinKeyVersion: encrypted.keyVersion
  };
}

export async function prepareCreatedAccountCredentialDualWrites(input: {
  accountId: string;
  password: string;
  profiles: ReadonlyArray<CreatedProfileCredential>;
  keyProvider?: KeyProvider;
}) {
  const keyProvider = input.keyProvider ?? getCredentialKeyProvider();
  const account = await prepareAccountPasswordDualWrite({
    accountId: input.accountId,
    password: input.password,
    keyProvider
  });
  const profiles: Array<{ id: string; data: ProfilePinDualWrite }> = [];

  for (const profile of input.profiles) {
    profiles.push({
      id: profile.id,
      data: await prepareProfilePinDualWrite({
        profileId: profile.id,
        pin: profile.pin,
        keyProvider
      })
    });
  }

  return {
    account: { id: input.accountId, data: account },
    profiles
  };
}

export async function protectCreatedAccountCredentials(input: {
  transaction: Prisma.TransactionClient;
  accountId: string;
  password: string;
  profiles: ReadonlyArray<CreatedProfileCredential>;
  keyProvider?: KeyProvider;
}) {
  const writes = await prepareCreatedAccountCredentialDualWrites(input);

  await input.transaction.account.update({
    where: { id: writes.account.id },
    data: writes.account.data,
    select: { id: true }
  });

  for (const profile of writes.profiles) {
    await input.transaction.profile.update({
      where: { id: profile.id },
      data: profile.data,
      select: { id: true }
    });
  }
}
