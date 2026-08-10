import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  operationalAccountSelect,
  toComboSaleDeliveryDto,
  toIndividualSaleDeliveryDto,
  toOperationalAccountDto
} from "./operational-account-dto";
import {
  comboSaleProfileSelect,
  individualSaleProfileSelect
} from "../sales/sale-profile-selects";

const storageSecretKeys = [
  "passwordEncryptedPayload",
  "passwordKeyVersion",
  "pinEncryptedPayload",
  "pinKeyVersion"
] as const;

function sourceAccount() {
  return {
    id: "account-test",
    email: "cuenta@example.test",
    password: "legacy-password",
    passwordEncryptedPayload: "ciphertext-account-test",
    passwordKeyVersion: "key-account-test",
    billingDate: new Date("2026-09-01T00:00:00.000Z"),
    purchaseCents: 12000,
    hidden: false,
    futureSensitiveField: "must-not-cross-the-boundary",
    product: {
      id: "product-test",
      name: "Servicio de prueba",
      color: "#123456",
      imageUrl: null,
      futureProductField: "must-not-cross-the-boundary"
    },
    provider: {
      id: "provider-test",
      name: "Proveedor de prueba",
      futureProviderField: "must-not-cross-the-boundary"
    },
    profiles: [
      {
        id: "profile-test",
        name: "Perfil de prueba",
        pin: "4321",
        pinEncryptedPayload: "ciphertext-profile-test",
        pinKeyVersion: "key-profile-test",
        dueDate: new Date("2026-09-15T00:00:00.000Z"),
        soldCents: 20000,
        futureSensitiveField: "must-not-cross-the-boundary",
        client: {
          id: "client-test",
          name: "Cliente de prueba",
          phone: "+570000000000",
          futureClientField: "must-not-cross-the-boundary"
        }
      }
    ]
  };
}

const deliveryClient = {
  id: "client-test",
  name: "Cliente de prueba",
  phone: "+570000000000",
  email: "cliente@example.test",
  notes: "Notas operacionales",
  status: "ACTIVE" as const,
  futureSensitiveField: "must-not-cross-the-boundary"
};

function assertStorageSecretsAbsent(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const key of storageSecretKeys) {
    assert.equal(serialized.includes(key), false, `${key} no debe aparecer en la salida`);
  }
}

describe("barrera DTO operacional de Account/Profile", () => {
  it("excluye passwordEncryptedPayload y passwordKeyVersion con valores no nulos", () => {
    const dto = toOperationalAccountDto(sourceAccount());

    assert.equal("passwordEncryptedPayload" in dto, false);
    assert.equal("passwordKeyVersion" in dto, false);
  });

  it("conserva password legacy requerido por el contrato operacional actual", () => {
    const dto = toOperationalAccountDto(sourceAccount());

    assert.equal(dto.password, "legacy-password");
  });

  it("excluye pinEncryptedPayload y pinKeyVersion de perfiles anidados con valores no nulos", () => {
    const [profile] = toOperationalAccountDto(sourceAccount()).profiles;

    assert.equal("pinEncryptedPayload" in profile, false);
    assert.equal("pinKeyVersion" in profile, false);
  });

  it("conserva pin legacy requerido por el contrato operacional actual", () => {
    const [profile] = toOperationalAccountDto(sourceAccount()).profiles;

    assert.equal(profile.pin, "4321");
  });

  it("no propaga propiedades fuente desconocidas del Account ni de sus relaciones", () => {
    const dto = toOperationalAccountDto(sourceAccount());

    assert.deepEqual(Object.keys(dto).sort(), [
      "billingDate",
      "email",
      "hidden",
      "id",
      "password",
      "product",
      "profiles",
      "provider",
      "purchaseCents"
    ]);
    assert.equal("futureSensitiveField" in dto, false);
    assert.equal("futureProductField" in dto.product, false);
    assert.equal("futureProviderField" in (dto.provider ?? {}), false);
    assert.equal("futureSensitiveField" in dto.profiles[0], false);
    assert.equal("futureClientField" in (dto.profiles[0].client ?? {}), false);
  });

  it("serializa fechas al contrato string usado por el navegador", () => {
    const dto = toOperationalAccountDto(sourceAccount());

    assert.equal(dto.billingDate, "2026-09-01T00:00:00.000Z");
    assert.equal(dto.profiles[0].dueDate, "2026-09-15T00:00:00.000Z");
  });

  it("protege el objeto delivery de venta individual", () => {
    const delivery = toIndividualSaleDeliveryDto({
      client: deliveryClient,
      profileId: "profile-test",
      account: sourceAccount()
    });

    assertStorageSecretsAbsent(delivery);
    assert.equal(delivery.account.password, "legacy-password");
    assert.equal(delivery.account.profiles[0].pin, "4321");
    assert.equal("futureSensitiveField" in delivery.client, false);
  });

  it("protege cada entry del delivery de venta combo", () => {
    const delivery = toComboSaleDeliveryDto({
      client: deliveryClient,
      entries: [
        { account: sourceAccount(), profileId: "profile-test" },
        { account: sourceAccount(), profileId: null }
      ]
    });

    assertStorageSecretsAbsent(delivery);
    assert.equal(delivery.entries.length, 2);
    for (const entry of delivery.entries) {
      assert.equal(entry.account.password, "legacy-password");
      assert.equal(entry.account.profiles[0].pin, "4321");
    }
  });

  it("el select Prisma operacional no carga los cuatro campos internos", () => {
    assert.equal("passwordEncryptedPayload" in operationalAccountSelect, false);
    assert.equal("passwordKeyVersion" in operationalAccountSelect, false);
    assert.equal("pinEncryptedPayload" in operationalAccountSelect.profiles.select, false);
    assert.equal("pinKeyVersion" in operationalAccountSelect.profiles.select, false);
  });

  it("el select Prisma usa allowlist exacta para Account y Profile", () => {
    assert.deepEqual(Object.keys(operationalAccountSelect).sort(), [
      "billingDate",
      "email",
      "hidden",
      "id",
      "password",
      "product",
      "profiles",
      "provider",
      "purchaseCents"
    ]);
    assert.deepEqual(Object.keys(operationalAccountSelect.profiles.select).sort(), [
      "client",
      "dueDate",
      "id",
      "name",
      "pin",
      "soldCents"
    ]);
  });

  it("los selects internos de ventas cargan solo los campos Profile necesarios", () => {
    assert.deepEqual(Object.keys(individualSaleProfileSelect).sort(), [
      "account",
      "accountId",
      "clientId",
      "id",
      "soldCents"
    ]);
    assert.deepEqual(Object.keys(individualSaleProfileSelect.account.select).sort(), [
      "deletedAt",
      "email",
      "productId"
    ]);
    assert.deepEqual(Object.keys(comboSaleProfileSelect).sort(), [
      "account",
      "accountId",
      "clientId",
      "id"
    ]);
    assert.deepEqual(Object.keys(comboSaleProfileSelect.account.select).sort(), [
      "deletedAt",
      "productId"
    ]);

    for (const select of [individualSaleProfileSelect, comboSaleProfileSelect]) {
      assert.equal("pinEncryptedPayload" in select, false);
      assert.equal("pinKeyVersion" in select, false);
    }
  });
});
