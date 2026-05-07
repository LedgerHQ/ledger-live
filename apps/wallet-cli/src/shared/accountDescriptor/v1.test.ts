import { describe, expect, it } from "bun:test";
import { parseV1, serializeV1 } from "./v1";
import type { AccountDescriptorV1, UtxoAccountDescriptorV1 } from "./v1";
import { XPUB, ETH_ADDR, SOL_ADDR } from "./test-fixtures";

const UTXO_V1: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: XPUB,
  path: "m/84h/0h/0h",
};

const ETH_V1: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: ETH_ADDR,
  path: "m/44h/60h/0h/0/0",
};

describe("serializeV1", () => {
  it("serializes a utxo descriptor", () => {
    expect(serializeV1(UTXO_V1)).toBe(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`);
  });

  it("serializes an address descriptor", () => {
    expect(serializeV1(ETH_V1)).toBe(
      `account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/0`,
    );
  });

  it("serializes a testnet utxo descriptor", () => {
    const d: AccountDescriptorV1 = {
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "testnet" },
      xpub: XPUB,
      path: "m/84h/1h/0h",
    };
    expect(serializeV1(d)).toBe(`account:1:utxo:bitcoin:testnet:${XPUB}:m/84h/1h/0h`);
  });

  it("serializes a solana address descriptor", () => {
    const d: AccountDescriptorV1 = {
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "solana", env: "main" },
      address: SOL_ADDR,
      path: "m/44h/501h/0h/0h",
    };
    expect(serializeV1(d)).toBe(`account:1:address:solana:main:${SOL_ADDR}:m/44h/501h/0h/0h`);
  });
});

describe("parseV1", () => {
  it("parses a utxo descriptor", () => {
    const result = parseV1(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`);
    expect(result).toEqual(UTXO_V1);
  });

  it("parses an address descriptor", () => {
    const result = parseV1(`account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/0`);
    expect(result).toEqual(ETH_V1);
  });

  it("accepts apostrophe hardened markers as aliases for h", () => {
    const result = parseV1(`account:1:utxo:bitcoin:main:${XPUB}:m/84'/0'/0'`);
    expect(result.type).toBe("utxo");
    expect((result as UtxoAccountDescriptorV1).path).toBe("m/84'/0'/0'");
  });

  it("round-trips: serializeV1 → parseV1", () => {
    const serialized = serializeV1(UTXO_V1);
    expect(parseV1(serialized)).toEqual(UTXO_V1);
  });

  it("round-trips for address type", () => {
    const serialized = serializeV1(ETH_V1);
    expect(parseV1(serialized)).toEqual(ETH_V1);
  });

  it("throws on too few segments", () => {
    expect(() => parseV1("account:1:utxo:bitcoin:main")).toThrow(/expected at least 7/);
  });

  it("throws on wrong purpose", () => {
    expect(() => parseV1(`wallet:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toThrow(/purpose/);
  });

  it("throws on wrong version", () => {
    expect(() => parseV1(`account:2:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toThrow(/version/);
  });

  it("throws on unknown type", () => {
    expect(() => parseV1(`account:1:xpub:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toThrow(/type/i);
  });

  it("throws when utxo path has non-hardened segments", () => {
    expect(() => parseV1(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0`)).toThrow();
  });

  it.each(["xprv", "yprv", "zprv", "tprv", "uprv", "vprv"])("throws when xpub field contains a %s private extended key", prefix => {
    expect(() => parseV1(`account:1:utxo:bitcoin:main:${prefix}SomeKey:m/84h/0h/0h`)).toThrow(
      /private extended key/,
    );
  });
});
