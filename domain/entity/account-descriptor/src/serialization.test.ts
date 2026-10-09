import { InvalidAccountDescriptorError } from "./errors";
import { ETH_ADDR, SOL_ADDR, XPUB } from "./test-fixtures";
import { AccountDescriptorSchema, type AccountDescriptor } from "./schema";
import { parseAccountDescriptor, serializeAccountDescriptor } from "./serialization";

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

const SOL: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "solana", env: "devnet" },
  address: SOL_ADDR,
  path: "m/44h/501h/0h/0h",
};

describe("serializeAccountDescriptor", () => {
  it("keeps the string form wallet-cli stores", () => {
    expect(serializeAccountDescriptor(UTXO)).toBe(
      `account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`,
    );
    expect(serializeAccountDescriptor(ETH)).toBe(
      `account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/0`,
    );
    expect(serializeAccountDescriptor(SOL)).toBe(
      `account:1:address:solana:devnet:${SOL_ADDR}:m/44h/501h/0h/0h`,
    );
  });
});

describe("parseAccountDescriptor", () => {
  it.each([UTXO, ETH, SOL])("round-trips $type $network.name", descriptor => {
    expect(parseAccountDescriptor(serializeAccountDescriptor(descriptor))).toEqual(descriptor);
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
    ["too few fields", "account:1:utxo:bitcoin:main"],
    ["wrong purpose", `wallet:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`],
    ["wrong version", `account:2:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`],
    ["unknown type", `account:1:xpub:bitcoin:main:${XPUB}:m/84h/0h/0h`],
  ])("rejects %s", (_, input) => {
    expect(() => parseAccountDescriptor(input)).toThrow(InvalidAccountDescriptorError);
  });

  it("rejects a non hardened utxo path", () => {
    expect(() => parseAccountDescriptor(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0`)).toThrow(
      InvalidAccountDescriptorError,
    );
  });

  it("rejects an address path that is not a derivation path", () => {
    expect(() =>
      parseAccountDescriptor(`account:1:address:ethereum:main:${ETH_ADDR}:garbage`),
    ).toThrow(InvalidAccountDescriptorError);
  });

  it("rejects ':' in the network fields", () => {
    expect(
      AccountDescriptorSchema.safeParse({ ...ETH, network: { name: "a:b", env: "main" } }).success,
    ).toBe(false);
  });

  it.each([
    `account:1:utxo:bitcoin:main:${XPUB}`,
    `${XPUB}:1:utxo:bitcoin:main:a:m/84h/0h/0h`,
    `account:${XPUB}:utxo:bitcoin:main:a:m/84h/0h/0h`,
    `account:1:${XPUB}:bitcoin:main:a:m/84h/0h/0h`,
  ])("does not leak the input in the error message of %s", input => {
    expect(() => parseAccountDescriptor(input)).toThrow(InvalidAccountDescriptorError);
    expect(() => parseAccountDescriptor(input)).not.toThrow(new RegExp(XPUB));
  });

  it.each([
    `account:1:utxo:bitcoin:main:${XPUB}:m/084h/0h/0h`,
    `account:1:utxo:bitcoin:main:${XPUB}:m/2147483648h/0h/0h`,
    `account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/00`,
    `account:1:address:ethereum:main:${ETH_ADDR}:m/44h/60h/0h/0/2147483648`,
  ])("rejects the non-canonical or out-of-range path of %s", input => {
    expect(() => parseAccountDescriptor(input)).toThrow(InvalidAccountDescriptorError);
  });

  it.each([" xprvKey", "\txprvKey"])("rejects a whitespace-prefixed private key %j", xpub => {
    expect(() => parseAccountDescriptor(`account:1:utxo:bitcoin:main:${xpub}:m/84h/0h/0h`)).toThrow(
      InvalidAccountDescriptorError,
    );
  });

  it.each(["xprv", "yprv", "zprv", "tprv", "uprv", "vprv", "Yprv", "Zprv", "Uprv", "Vprv"])(
    "rejects a %s key",
    prefix => {
      expect(() =>
        parseAccountDescriptor(`account:1:utxo:bitcoin:main:${prefix}Key:m/84h/0h/0h`),
      ).toThrow(InvalidAccountDescriptorError);
    },
  );
});
