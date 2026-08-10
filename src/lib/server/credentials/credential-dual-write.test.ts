import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import type { Prisma } from "@prisma/client";

import { decryptCredential, encryptCredential } from "./credential-crypto";
import {
  prepareAccountPasswordDualWrite,
  prepareCreatedAccountCredentialDualWrites,
  prepareProfilePinDualWrite,
  protectCreatedAccountCredentials
} from "./credential-dual-write";
import { InMemoryKeyProvider } from "./in-memory-key-provider";
import type { KeyProvider } from "./key-provider";

const accountId = "account-dual-write-test";
const profileId = "profile-dual-write-test";

function createProvider(activeKeyVersion = "v1", keys?: Readonly<Record<string, Uint8Array>>) {
  return new InMemoryKeyProvider({
    activeKeyVersion,
    keys: keys ?? { v1: randomBytes(32) }
  });
}

describe("dual-write de credenciales", () => {
  it("conserva el password legacy exactamente como lo recibe", async () => {
    const password = "  password con espacios  ";

    const write = await prepareAccountPasswordDualWrite({
      accountId,
      password,
      keyProvider: createProvider()
    });

    assert.equal(write.password, password);
  });

  it("genera un payload cifrado no vacío para Account.password", async () => {
    const write = await prepareAccountPasswordDualWrite({
      accountId,
      password: "password-test",
      keyProvider: createProvider()
    });

    assert.equal(typeof write.passwordEncryptedPayload, "string");
    assert.ok(write.passwordEncryptedPayload.length > 0);
  });

  it("guarda la keyVersion activa para Account.password", async () => {
    const write = await prepareAccountPasswordDualWrite({
      accountId,
      password: "password-test",
      keyProvider: createProvider("v2", { v2: randomBytes(32) })
    });

    assert.equal(write.passwordKeyVersion, "v2");
  });

  it("el payload de Account descifra con recordId y field correctos", async () => {
    const keyProvider = createProvider();
    const password = "contraseña sintética 🔐";
    const write = await prepareAccountPasswordDualWrite({ accountId, password, keyProvider });

    const decrypted = await decryptCredential({
      encryptedPayload: write.passwordEncryptedPayload,
      keyVersion: write.passwordKeyVersion,
      recordType: "Account",
      recordId: accountId,
      fieldName: "password",
      keyProvider
    });

    assert.equal(decrypted, password);
  });

  it("normaliza un PIN presente con trim y conserva ese mismo valor legacy", async () => {
    const write = await prepareProfilePinDualWrite({
      profileId,
      pin: "  4321  ",
      keyProvider: createProvider()
    });

    assert.equal(write.pin, "4321");
  });

  it("genera payload y keyVersion para un PIN presente", async () => {
    const write = await prepareProfilePinDualWrite({
      profileId,
      pin: "4321",
      keyProvider: createProvider("v2", { v2: randomBytes(32) })
    });

    assert.ok(write.pinEncryptedPayload);
    assert.equal(write.pinKeyVersion, "v2");
  });

  it("canonicaliza PIN null a NULL/NULL/NULL", async () => {
    const write = await prepareProfilePinDualWrite({ profileId, pin: null });

    assert.deepEqual(write, {
      pin: null,
      pinEncryptedPayload: null,
      pinKeyVersion: null
    });
  });

  it("canonicaliza PIN vacío a NULL/NULL/NULL", async () => {
    const write = await prepareProfilePinDualWrite({ profileId, pin: "" });

    assert.deepEqual(write, {
      pin: null,
      pinEncryptedPayload: null,
      pinKeyVersion: null
    });
  });

  it("canonicaliza PIN whitespace a NULL/NULL/NULL", async () => {
    const write = await prepareProfilePinDualWrite({ profileId, pin: " \t\n " });

    assert.deepEqual(write, {
      pin: null,
      pinEncryptedPayload: null,
      pinKeyVersion: null
    });
  });

  it("el PIN cifrado descifra al valor normalizado", async () => {
    const keyProvider = createProvider();
    const write = await prepareProfilePinDualWrite({
      profileId,
      pin: "  9876 ",
      keyProvider
    });
    assert.ok(write.pinEncryptedPayload);
    assert.ok(write.pinKeyVersion);

    const decrypted = await decryptCredential({
      encryptedPayload: write.pinEncryptedPayload,
      keyVersion: write.pinKeyVersion,
      recordType: "Profile",
      recordId: profileId,
      fieldName: "pin",
      keyProvider
    });

    assert.equal(decrypted, "9876");
  });

  it("usa v2 para nuevas escrituras y mantiene v1 resoluble durante rotación", async () => {
    const v1 = randomBytes(32);
    const v2 = randomBytes(32);
    const oldProvider = createProvider("v1", { v1 });
    const oldEncrypted = await encryptCredential({
      plaintext: "password-v1",
      recordType: "Account",
      recordId: accountId,
      fieldName: "password",
      keyProvider: oldProvider
    });
    const rotatedProvider = createProvider("v2", { v1, v2 });

    const write = await prepareAccountPasswordDualWrite({
      accountId,
      password: "password-v2",
      keyProvider: rotatedProvider
    });

    assert.equal(write.passwordKeyVersion, "v2");
    assert.equal(
      await decryptCredential({
        ...oldEncrypted,
        recordType: "Account",
        recordId: accountId,
        fieldName: "password",
        keyProvider: rotatedProvider
      }),
      "password-v1"
    );
  });

  it("falla cerrado si la clave activa no está disponible", async () => {
    const keyProvider = createProvider("v2", { v1: randomBytes(32) });

    await assert.rejects(
      prepareAccountPasswordDualWrite({ accountId, password: "password-test", keyProvider }),
      (error: unknown) => error instanceof Error && error.message === "La versión de clave no está disponible."
    );
  });

  it("los errores no contienen password, PIN ni material de clave", async () => {
    const password = "password-secret-test";
    const pin = "pin-secret-test";
    const keyMaterial = "key-material-secret-test";
    const failingProvider: KeyProvider = {
      getActiveKeyVersion: async () => "v1",
      getKey: async () => {
        throw new Error(keyMaterial);
      }
    };

    for (const operation of [
      prepareAccountPasswordDualWrite({ accountId, password, keyProvider: failingProvider }),
      prepareProfilePinDualWrite({ profileId, pin, keyProvider: failingProvider })
    ]) {
      await assert.rejects(operation, (error: unknown) => {
        assert.ok(error instanceof Error);
        const rendered = `${error.name}: ${error.message}`;
        assert.equal(rendered.includes(password), false);
        assert.equal(rendered.includes(pin), false);
        assert.equal(rendered.includes(keyMaterial), false);
        return true;
      });
    }
  });

  it("AAD con recordId incorrecto no descifra el payload producido", async () => {
    const keyProvider = createProvider();
    const write = await prepareAccountPasswordDualWrite({
      accountId,
      password: "password-test",
      keyProvider
    });

    await assert.rejects(
      decryptCredential({
        encryptedPayload: write.passwordEncryptedPayload,
        keyVersion: write.passwordKeyVersion,
        recordType: "Account",
        recordId: "other-account-id",
        fieldName: "password",
        keyProvider
      })
    );
  });

  it("los helpers devuelven únicamente las propiedades allowlisted", async () => {
    const keyProvider = createProvider();
    const accountWrite = await prepareAccountPasswordDualWrite({
      accountId,
      password: "password-test",
      keyProvider
    });
    const profileWrite = await prepareProfilePinDualWrite({ profileId, pin: "1234", keyProvider });

    assert.deepEqual(Object.keys(accountWrite).sort(), [
      "password",
      "passwordEncryptedPayload",
      "passwordKeyVersion"
    ]);
    assert.deepEqual(Object.keys(profileWrite).sort(), [
      "pin",
      "pinEncryptedPayload",
      "pinKeyVersion"
    ]);
  });

  it("prepara todos los Profiles de una Account creada, presentes y ausentes", async () => {
    const keyProvider = createProvider();
    const writes = await prepareCreatedAccountCredentialDualWrites({
      accountId,
      password: "password-test",
      profiles: [
        { id: "profile-present", pin: " 1111 " },
        { id: "profile-null", pin: null },
        { id: "profile-empty", pin: "" },
        { id: "profile-undefined", pin: undefined }
      ],
      keyProvider
    });

    assert.deepEqual(Object.keys(writes).sort(), ["account", "profiles"]);
    assert.deepEqual(Object.keys(writes.account).sort(), ["data", "id"]);
    assert.equal(writes.account.id, accountId);
    assert.equal(writes.profiles.length, 4);
    assert.equal(writes.profiles[0].data.pin, "1111");
    assert.ok(writes.profiles[0].data.pinEncryptedPayload);
    for (const profile of writes.profiles.slice(1)) {
      assert.deepEqual(profile.data, {
        pin: null,
        pinEncryptedPayload: null,
        pinKeyVersion: null
      });
    }
  });

  it("prepara la lista completa antes de ejecutar updates de una Account creada", async () => {
    const key = randomBytes(32);
    let keyReads = 0;
    let updateCalls = 0;
    const failingProvider: KeyProvider = {
      getActiveKeyVersion: async () => "v1",
      getKey: async () => {
        keyReads += 1;
        return keyReads < 3 ? key : undefined;
      }
    };
    const transaction = {
      account: {
        update: async () => {
          updateCalls += 1;
          return { id: accountId };
        }
      },
      profile: {
        update: async () => {
          updateCalls += 1;
          return { id: profileId };
        }
      }
    } as unknown as Prisma.TransactionClient;

    await assert.rejects(
      protectCreatedAccountCredentials({
        transaction,
        accountId,
        password: "password-test",
        profiles: [
          { id: "profile-first", pin: "1111" },
          { id: "profile-failing", pin: "2222" }
        ],
        keyProvider: failingProvider
      })
    );

    assert.equal(updateCalls, 0);
  });
});
