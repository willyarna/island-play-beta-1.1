import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EnvironmentKeyProvider,
  EnvironmentKeyProviderError,
  type EnvironmentKeyProviderErrorCode
} from "./environment-key-provider";

const ACTIVE_VERSION_VARIABLE = "CREDENTIAL_KEY_ACTIVE_VERSION";
const V1_KEY_VARIABLE = "CREDENTIAL_KEY_V1_BASE64URL";
const V2_KEY_VARIABLE = "CREDENTIAL_KEY_V2_BASE64URL";
const V1_KEY = Buffer.alloc(32, 1).toString("base64url");
const V2_KEY = Buffer.alloc(32, 2).toString("base64url");

function createEnvironment(
  activeKeyVersion = "v1",
  extra: Readonly<Record<string, string | undefined>> = {}
) {
  return {
    [ACTIVE_VERSION_VARIABLE]: activeKeyVersion,
    [V1_KEY_VARIABLE]: V1_KEY,
    ...extra
  };
}

function hasProviderCode(error: unknown, code: EnvironmentKeyProviderErrorCode) {
  return error instanceof EnvironmentKeyProviderError && error.code === code;
}

function assertKeyEquals(actual: Uint8Array | undefined, expected: Uint8Array) {
  assert.ok(actual);
  assert.deepEqual([...actual], [...expected]);
}

function makeNonCanonicalBase64Url(canonical: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const lastCharacterIndex = alphabet.indexOf(canonical.at(-1) ?? "");
  assert.ok(lastCharacterIndex >= 0 && lastCharacterIndex < alphabet.length - 1);
  return `${canonical.slice(0, -1)}${alphabet[lastCharacterIndex + 1]}`;
}

describe("EnvironmentKeyProvider", () => {
  for (const activeKeyVersion of ["v1", "v2", "v10", "v999"]) {
    it(`acepta la versión activa válida ${activeKeyVersion}`, async () => {
      const keyVariable = `CREDENTIAL_KEY_${activeKeyVersion.toUpperCase()}_BASE64URL`;
      const provider = new EnvironmentKeyProvider(createEnvironment(activeKeyVersion, {
        [keyVariable]: V2_KEY
      }));

      assert.equal(await provider.getActiveKeyVersion(), activeKeyVersion);
    });
  }

  it("decodifica una clave Base64URL canónica de exactamente 32 bytes", async () => {
    const provider = new EnvironmentKeyProvider(createEnvironment());

    assertKeyEquals(await provider.getKey("v1"), Buffer.alloc(32, 1));
  });

  it("rechaza una versión activa ausente", () => {
    assert.throws(
      () => new EnvironmentKeyProvider({ [V1_KEY_VARIABLE]: V1_KEY }),
      (error) => hasProviderCode(error, "MISSING_ACTIVE_KEY_VERSION")
    );
  });

  for (const activeKeyVersion of ["v0", "v01", "V1", "1", "v-1", " v1 ", "v1-space", "v1000000000"]) {
    it(`rechaza la versión activa inválida ${JSON.stringify(activeKeyVersion)}`, () => {
      assert.throws(
        () => new EnvironmentKeyProvider(createEnvironment(activeKeyVersion)),
        (error) => hasProviderCode(error, "INVALID_KEY_VERSION")
      );
    });
  }

  it("rechaza la ausencia de la clave de la versión activa", () => {
    assert.throws(
      () => new EnvironmentKeyProvider({ [ACTIVE_VERSION_VARIABLE]: "v1" }),
      (error) => hasProviderCode(error, "MISSING_ACTIVE_KEY")
    );
  });

  it("rechaza Base64URL con caracteres inválidos o codificación no canónica", () => {
    for (const invalidKey of ["", `${V1_KEY.slice(0, -1)}!`, makeNonCanonicalBase64Url(V1_KEY)]) {
      assert.throws(
        () => new EnvironmentKeyProvider(createEnvironment("v1", { [V1_KEY_VARIABLE]: invalidKey })),
        (error) => hasProviderCode(error, "INVALID_KEY_MATERIAL")
      );
    }
  });

  it("rechaza Base64 estándar con + o /", () => {
    const standardBase64Keys = [
      Buffer.alloc(32, 251).toString("base64").replace(/=+$/, ""),
      Buffer.alloc(32, 255).toString("base64").replace(/=+$/, "")
    ];

    for (const invalidKey of standardBase64Keys) {
      assert.match(invalidKey, /[+/]/);
      assert.throws(
        () => new EnvironmentKeyProvider(createEnvironment("v1", { [V1_KEY_VARIABLE]: invalidKey })),
        (error) => hasProviderCode(error, "INVALID_KEY_MATERIAL")
      );
    }
  });

  it("rechaza padding =", () => {
    assert.throws(
      () => new EnvironmentKeyProvider(createEnvironment("v1", { [V1_KEY_VARIABLE]: `${V1_KEY}=` })),
      (error) => hasProviderCode(error, "INVALID_KEY_MATERIAL")
    );
  });

  it("rechaza espacios iniciales y finales", () => {
    for (const invalidKey of [` ${V1_KEY}`, `${V1_KEY} `]) {
      assert.throws(
        () => new EnvironmentKeyProvider(createEnvironment("v1", { [V1_KEY_VARIABLE]: invalidKey })),
        (error) => hasProviderCode(error, "INVALID_KEY_MATERIAL")
      );
    }
  });

  it("rechaza claves que decodifican a 31 bytes", () => {
    assert.throws(
      () => new EnvironmentKeyProvider(createEnvironment("v1", {
        [V1_KEY_VARIABLE]: Buffer.alloc(31, 1).toString("base64url")
      })),
      (error) => hasProviderCode(error, "INVALID_KEY_MATERIAL")
    );
  });

  it("rechaza claves que decodifican a 33 bytes", () => {
    assert.throws(
      () => new EnvironmentKeyProvider(createEnvironment("v1", {
        [V1_KEY_VARIABLE]: Buffer.alloc(33, 1).toString("base64url")
      })),
      (error) => hasProviderCode(error, "INVALID_KEY_MATERIAL")
    );
  });

  it("conserva varias versiones configuradas", async () => {
    const provider = new EnvironmentKeyProvider(createEnvironment("v2", {
      [V2_KEY_VARIABLE]: V2_KEY
    }));

    assertKeyEquals(await provider.getKey("v1"), Buffer.alloc(32, 1));
    assertKeyEquals(await provider.getKey("v2"), Buffer.alloc(32, 2));
  });

  it("getKey devuelve exactamente la versión solicitada", async () => {
    const provider = new EnvironmentKeyProvider(createEnvironment("v2", {
      [V2_KEY_VARIABLE]: V2_KEY
    }));
    const v1Key = await provider.getKey("v1");
    const v2Key = await provider.getKey("v2");

    assert.notDeepEqual([...(v1Key ?? [])], [...(v2Key ?? [])]);
    assertKeyEquals(v2Key, Buffer.alloc(32, 2));
  });

  it("devuelve undefined para una versión válida no configurada", async () => {
    const provider = new EnvironmentKeyProvider(createEnvironment());

    assert.equal(await provider.getKey("v2"), undefined);
  });

  it("devuelve una copia para que el consumidor no pueda mutar el provider", async () => {
    const provider = new EnvironmentKeyProvider(createEnvironment());
    const firstRead = await provider.getKey("v1");
    assert.ok(firstRead);

    firstRead[0] = 255;

    assertKeyEquals(await provider.getKey("v1"), Buffer.alloc(32, 1));
  });

  it("toma un snapshot independiente del buffer y objeto fuente", async () => {
    const sourceKey = Buffer.alloc(32, 7);
    const environment: Record<string, string | undefined> = {
      [ACTIVE_VERSION_VARIABLE]: "v1",
      [V1_KEY_VARIABLE]: sourceKey.toString("base64url")
    };
    const provider = new EnvironmentKeyProvider(environment);

    sourceKey.fill(8);
    environment[ACTIVE_VERSION_VARIABLE] = "v2";
    environment[V1_KEY_VARIABLE] = V2_KEY;
    environment[V2_KEY_VARIABLE] = sourceKey.toString("base64url");

    assert.equal(await provider.getActiveKeyVersion(), "v1");
    assertKeyEquals(await provider.getKey("v1"), Buffer.alloc(32, 7));
    assert.equal(await provider.getKey("v2"), undefined);
  });

  it("mantiene aislado el estado de providers construidos con entornos distintos", async () => {
    const firstProvider = new EnvironmentKeyProvider(createEnvironment());
    const secondProvider = new EnvironmentKeyProvider({
      [ACTIVE_VERSION_VARIABLE]: "v1",
      [V1_KEY_VARIABLE]: V2_KEY
    });

    assertKeyEquals(await firstProvider.getKey("v1"), Buffer.alloc(32, 1));
    assertKeyEquals(await secondProvider.getKey("v1"), Buffer.alloc(32, 2));
  });

  it("usa errores allowlisted que no contienen ningún secret", () => {
    const secret = `secret-${V1_KEY}`;

    assert.throws(
      () => new EnvironmentKeyProvider(createEnvironment("v1", { [V1_KEY_VARIABLE]: secret })),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentKeyProviderError);
        const renderedError = `${error.name}: ${error.message} (${error.code})`;
        assert.equal(renderedError.includes(secret), false);
        assert.equal(renderedError.includes(V1_KEY), false);
        return true;
      }
    );
  });

  it("rechaza una configuración vacía", () => {
    assert.throws(
      () => new EnvironmentKeyProvider({}),
      (error) => hasProviderCode(error, "MISSING_ACTIVE_KEY_VERSION")
    );
  });

  it("rechaza nombres y versiones solicitadas mal formadas", async () => {
    assert.throws(
      () => new EnvironmentKeyProvider(createEnvironment("v1", {
        CREDENTIAL_KEY_V01_BASE64URL: V2_KEY
      })),
      (error) => hasProviderCode(error, "INVALID_KEY_VARIABLE_NAME")
    );

    const provider = new EnvironmentKeyProvider(createEnvironment());
    await assert.rejects(
      provider.getKey("v01"),
      (error) => hasProviderCode(error, "INVALID_KEY_VERSION")
    );
  });

  it("funciona solo con el entorno sintético sin depender de process.env", async () => {
    const syntheticEnvironment = createEnvironment();
    const provider = new EnvironmentKeyProvider(syntheticEnvironment);

    assert.equal(await provider.getActiveKeyVersion(), "v1");
    assertKeyEquals(await provider.getKey("v1"), Buffer.alloc(32, 1));
  });
});
