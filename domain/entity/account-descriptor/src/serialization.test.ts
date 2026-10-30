import { InvalidAccountDescriptorError } from "./errors";
import { ETH_ADDR, SOL_ADDR, XPUB } from "./test-fixtures";
import { AccountDescriptorSchema, type AccountDescriptor } from "./schema";
import { parseAccountDescriptor, serializeAccountDescriptor } from "./serialization";

const UTXO: AccountDescriptor = {
  purpose: "account",
  version: "2",
  type: "utxo",
  network: "bitcoin",
  xpub: XPUB,
  path: "m/84h/0h/0h",
};

const ETH: AccountDescriptor = {
  purpose: "account",
  version: "2",
  type: "address",
  network: "ethereum",
  address: ETH_ADDR,
  path: "m/44h/60h/0h/0/0",
};

const SOL: AccountDescriptor = {
  purpose: "account",
  version: "2",
  type: "address",
  network: "solana_devnet",
  address: SOL_ADDR,
  path: "m/44h/501h/0h/0h",
};

describe("serializeAccountDescriptor", () => {
  it("writes version 2", () => {
    expect(serializeAccountDescriptor(UTXO)).toBe(`account:2:utxo:bitcoin:${XPUB}:m/84h/0h/0h`);
    expect(serializeAccountDescriptor(ETH)).toBe(
      `account:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`,
    );
    expect(serializeAccountDescriptor(SOL)).toBe(
      `account:2:address:solana_devnet:${SOL_ADDR}:m/44h/501h/0h/0h`,
    );
  });
});

describe("parseAccountDescriptor", () => {
  it.each([UTXO, ETH, SOL])("round-trips $type $network", descriptor => {
    expect(parseAccountDescriptor(serializeAccountDescriptor(descriptor))).toEqual(descriptor);
  });

  it("round-trips a mock descriptor", () => {
    const mock: AccountDescriptor = { ...ETH, purpose: "mock" };
    expect(serializeAccountDescriptor(mock)).toBe(
      `mock:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`,
    );
    expect(parseAccountDescriptor(serializeAccountDescriptor(mock))).toEqual(mock);
  });

  it.each([
    { descriptor: UTXO, path: "m/84'/0'/0'" },
    { descriptor: UTXO, path: "m/84H/0H/0H" },
    { descriptor: ETH, path: "m/44'/60'/0'/0/0" },
    { descriptor: ETH, path: "m/44H/60H/0H/0/0" },
  ])("reads the hardened marker of $descriptor.type $path as h", ({ descriptor, path }) => {
    expect(parseAccountDescriptor(serializeAccountDescriptor({ ...descriptor, path }))).toEqual(
      descriptor,
    );
  });

  it.each([
    ["too few fields", "account:2:utxo:bitcoin:main"],
    ["version 1", `account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`],
    ["wrong purpose", `wallet:2:utxo:bitcoin:${XPUB}:m/84h/0h/0h`],
    ["wrong version", `account:3:utxo:bitcoin:${XPUB}:m/84h/0h/0h`],
    ["unknown type", `account:2:xpub:bitcoin:${XPUB}:m/84h/0h/0h`],
  ])("rejects %s", (_, input) => {
    expect(() => parseAccountDescriptor(input)).toThrow(InvalidAccountDescriptorError);
  });

  it("rejects a non hardened utxo path", () => {
    expect(() => parseAccountDescriptor(`account:2:utxo:bitcoin:${XPUB}:m/84h/0h/0`)).toThrow(
      InvalidAccountDescriptorError,
    );
  });

  it("rejects an address path that is not a derivation path", () => {
    expect(() => parseAccountDescriptor(`account:2:address:ethereum:${ETH_ADDR}:garbage`)).toThrow(
      InvalidAccountDescriptorError,
    );
  });

  it("rejects ':' in the network id", () => {
    expect(AccountDescriptorSchema.safeParse({ ...ETH, network: "a:b" }).success).toBe(false);
  });

  it.each([
    `account:2:utxo:bitcoin:${XPUB}`,
    `${XPUB}:2:utxo:bitcoin:a:m/84h/0h/0h`,
    `account:${XPUB}:utxo:bitcoin:a:m/84h/0h/0h`,
    `account:2:${XPUB}:bitcoin:a:m/84h/0h/0h`,
  ])("does not leak the input in the error message of %s", input => {
    expect(() => parseAccountDescriptor(input)).toThrow(InvalidAccountDescriptorError);
    expect(() => parseAccountDescriptor(input)).not.toThrow(new RegExp(XPUB));
  });

  it.each([
    `account:2:utxo:bitcoin:${XPUB}:m/084h/0h/0h`,
    `account:2:utxo:bitcoin:${XPUB}:m/2147483648h/0h/0h`,
    `account:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/00`,
    `account:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/2147483648`,
  ])("rejects the non-canonical or out-of-range path of %s", input => {
    expect(() => parseAccountDescriptor(input)).toThrow(InvalidAccountDescriptorError);
  });

  it.each([" xprvKey", "\txprvKey"])("rejects a whitespace-prefixed private key %j", xpub => {
    expect(() => parseAccountDescriptor(`account:2:utxo:bitcoin:${xpub}:m/84h/0h/0h`)).toThrow(
      InvalidAccountDescriptorError,
    );
  });

  it.each(["xprv", "yprv", "zprv", "tprv", "uprv", "vprv", "Yprv", "Zprv", "Uprv", "Vprv"])(
    "rejects a %s key",
    prefix => {
      expect(() =>
        parseAccountDescriptor(`account:2:utxo:bitcoin:${prefix}Key:m/84h/0h/0h`),
      ).toThrow(InvalidAccountDescriptorError);
    },
  );
});
