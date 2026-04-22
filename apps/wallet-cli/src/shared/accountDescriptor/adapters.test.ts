import { describe, expect, it } from "bun:test";
import { toV1, toV0, UnsupportedFamilyError } from "./adapters";
import type { AccountDescriptorV0 } from "./v0";
import type { AccountDescriptorV1, UtxoAccountDescriptorV1, AccountBasedDescriptorV1 } from "./v1";
import { XPUB, ETH_ADDR } from "./test-fixtures";

const BTC_V0: AccountDescriptorV0 = {
  id: `js:2:bitcoin:${XPUB}:native_segwit`,
  currencyId: "bitcoin",
  freshAddress: "bc1qexample",
  seedIdentifier: XPUB,
  derivationMode: "native_segwit",
  index: 0,
};

const ETH_V0: AccountDescriptorV0 = {
  id: `js:2:ethereum:${ETH_ADDR}:ethM`,
  currencyId: "ethereum",
  freshAddress: ETH_ADDR,
  seedIdentifier: ETH_ADDR,
  derivationMode: "ethM",
  index: 0,
};

describe("toV1 (V0 → V1)", () => {
  it("converts bitcoin native_segwit to utxo V1", () => {
    const v1 = toV1(BTC_V0);
    expect(v1.type).toBe("utxo");
    expect(v1.network).toEqual({ name: "bitcoin", env: "main" });
    expect((v1 as UtxoAccountDescriptorV1).xpub).toBe(XPUB);
    // native_segwit → purpose 84
    expect((v1 as UtxoAccountDescriptorV1).path).toMatch(/^m\/84h/);
  });

  it("produces a hardened-only path for utxo (no non-hardened suffix)", () => {
    const v1 = toV1(BTC_V0) as UtxoAccountDescriptorV1;
    const segments = v1.path.replace("m/", "").split("/");
    expect(segments.every(s => s.endsWith("h"))).toBe(true);
  });

  it("converts ethereum ethM to address V1", () => {
    const v1 = toV1(ETH_V0);
    expect(v1.type).toBe("address");
    expect(v1.network).toEqual({ name: "ethereum", env: "main" });
    expect((v1 as AccountBasedDescriptorV1).address).toBe(ETH_ADDR);
    // BIP44 → purpose 44
    expect((v1 as AccountBasedDescriptorV1).path).toMatch(/^m\/44h/);
  });

  it("encodes a non-zero account index correctly", () => {
    const v1 = toV1({ ...BTC_V0, index: 2 }) as UtxoAccountDescriptorV1;
    expect(v1.path).toMatch(/2h$/);
  });

  it("maps bitcoin_testnet currencyId to testnet env", () => {
    const v1 = toV1({ ...BTC_V0, currencyId: "bitcoin_testnet", id: `js:2:bitcoin_testnet:${XPUB}:native_segwit` });
    expect(v1.network).toEqual({ name: "bitcoin", env: "testnet" });
  });
});

describe("toV0 (V1 → V0)", () => {
  it("converts a utxo bitcoin V1 back to V0", () => {
    const btcV1: AccountDescriptorV1 = {
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/84h/0h/0h",
    };
    const v0 = toV0(btcV1);
    expect(v0.currencyId).toBe("bitcoin");
    expect(v0.seedIdentifier).toBe(XPUB);
    expect(v0.derivationMode).toBe("native_segwit");
    expect(v0.index).toBe(0);
    expect(v0.freshAddress).toBe("");
  });

  it("round-trips bitcoin V0 → V1 → V0", () => {
    const v1 = toV1(BTC_V0);
    const v0 = toV0(v1);
    expect(v0.currencyId).toBe(BTC_V0.currencyId);
    expect(v0.seedIdentifier).toBe(BTC_V0.seedIdentifier);
    expect(v0.derivationMode).toBe(BTC_V0.derivationMode);
    expect(v0.index).toBe(BTC_V0.index);
  });

  it("round-trips ethereum V0 → V1 → V0", () => {
    const v1 = toV1(ETH_V0);
    const v0 = toV0(v1);
    expect(v0.currencyId).toBe(ETH_V0.currencyId);
    expect(v0.seedIdentifier).toBe(ETH_V0.seedIdentifier);
    expect(v0.derivationMode).toBe(ETH_V0.derivationMode);
    expect(v0.index).toBe(ETH_V0.index);
  });

  it("reconstructs the account id correctly", () => {
    const v1 = toV1(BTC_V0);
    const v0 = toV0(v1);
    expect(v0.id).toBe(`js:2:bitcoin:${XPUB}:native_segwit`);
  });

  it("throws UnsupportedFamilyError when no derivation mode matches the path", () => {
    const badV1: AccountDescriptorV1 = {
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/999h/0h/0h",
    };
    expect(() => toV0(badV1)).toThrow(UnsupportedFamilyError);
  });
});
