import { describe, expect, it } from "@jest/globals";
import {
  accountDescriptorKey,
  canonicalizeAccountDescriptor,
  parseAccountDescriptor,
  serializeAccountDescriptor,
} from "./descriptor";
import type { AccountDescriptor, UtxoAccountDescriptor } from "./descriptor";
import { XPUB, ETH_ADDR, SOL_ADDR } from "./test-fixtures";

const UTXO: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: XPUB,
  path: "m/84h/0h/0h",
};

const ETH: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: ETH_ADDR,
  path: "m/44h/60h/0h/0/0",
};

describe("serializeAccountDescriptor", () => {
  it("serializes a utxo descriptor", () => {
    expect(serializeAccountDescriptor(UTXO)).toBe(
      `account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`,
    );
  });

  it("serializes an address descriptor", () => {
    expect(serializeAccountDescriptor(ETH)).toBe(
      `account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/0`,
    );
  });

  it("serializes a testnet utxo descriptor", () => {
    const d: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "testnet" },
      xpub: XPUB,
      path: "m/84h/1h/0h",
    };
    expect(serializeAccountDescriptor(d)).toBe(
      `account:1:utxo:bitcoin:testnet:${XPUB}:m/84h/1h/0h`,
    );
  });

  it("serializes a solana address descriptor", () => {
    const d: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "solana", env: "main" },
      address: SOL_ADDR,
      path: "m/44h/501h/0h/0h",
    };
    expect(serializeAccountDescriptor(d)).toBe(
      `account:1:address:solana:main:${SOL_ADDR}:m/44h/501h/0h/0h`,
    );
  });
});

describe("parseAccountDescriptor", () => {
  it("parses a utxo descriptor", () => {
    const result = parseAccountDescriptor(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`);
    expect(result).toEqual(UTXO);
  });

  it("parses an address descriptor", () => {
    const result = parseAccountDescriptor(
      `account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/0`,
    );
    expect(result).toEqual(ETH);
  });

  it("accepts apostrophe hardened markers as aliases for h", () => {
    const result = parseAccountDescriptor(`account:1:utxo:bitcoin:main:${XPUB}:m/84'/0'/0'`);
    expect(result.type).toBe("utxo");
    expect((result as UtxoAccountDescriptor).path).toBe("m/84'/0'/0'");
  });

  it("round-trips: serializeAccountDescriptor → parseAccountDescriptor", () => {
    const serialized = serializeAccountDescriptor(UTXO);
    expect(parseAccountDescriptor(serialized)).toEqual(UTXO);
  });

  it("round-trips for address type", () => {
    const serialized = serializeAccountDescriptor(ETH);
    expect(parseAccountDescriptor(serialized)).toEqual(ETH);
  });

  it("throws on too few segments", () => {
    expect(() => parseAccountDescriptor("account:1:utxo:bitcoin:main")).toThrow(
      /expected at least 7/,
    );
  });

  it("throws on wrong purpose", () => {
    expect(() => parseAccountDescriptor(`wallet:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toThrow(
      /purpose/,
    );
  });

  it("throws on wrong version", () => {
    expect(() => parseAccountDescriptor(`account:2:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toThrow(
      /version/,
    );
  });

  it("throws on unknown type", () => {
    expect(() => parseAccountDescriptor(`account:1:xpub:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toThrow(
      /type/i,
    );
  });

  it("throws when utxo path has non-hardened segments", () => {
    expect(() =>
      parseAccountDescriptor(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0`),
    ).toThrow();
  });

  it.each(["xprv", "yprv", "zprv", "tprv", "uprv", "vprv"])(
    "throws when xpub field contains a %s private extended key",
    prefix => {
      expect(() =>
        parseAccountDescriptor(`account:1:utxo:bitcoin:main:${prefix}SomeKey:m/84h/0h/0h`),
      ).toThrow(/private extended key/);
    },
  );
});

describe("accountDescriptorKey", () => {
  it("hashes the hardened marker spellings alike", () => {
    expect(accountDescriptorKey({ ...UTXO, path: "m/84'/0'/0'" })).toBe(accountDescriptorKey(UTXO));
  });

  it("ignores the case of an EVM address, not of a base58 one", () => {
    const lower: AccountDescriptor = { ...ETH, address: ETH_ADDR.toLowerCase() };
    expect(accountDescriptorKey(lower)).toBe(accountDescriptorKey(ETH));
    const solana: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "solana", env: "main" },
      address: SOL_ADDR,
      path: "m/44h/501h/0h/0h",
    };
    expect(accountDescriptorKey({ ...solana, address: SOL_ADDR.toLowerCase() })).not.toBe(
      accountDescriptorKey(solana),
    );
  });

  it("ignores the case of the network", () => {
    expect(accountDescriptorKey({ ...ETH, network: { name: "Ethereum", env: "MAIN" } })).toBe(
      accountDescriptorKey(ETH),
    );
  });

  it("leaves the descriptor itself, and its serialization, as given", () => {
    const given: AccountDescriptor = { ...ETH, path: "m/44'/60'/0'/0/0" };
    expect(canonicalizeAccountDescriptor(given)).not.toBe(given);
    expect(serializeAccountDescriptor(given)).toContain("m/44'/60'/0'/0/0");
  });
});
