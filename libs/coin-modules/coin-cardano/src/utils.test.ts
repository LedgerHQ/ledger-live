import {
  address as TyphonAddress,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import { isHexString } from "./logic";
import {
  EMPTY_CREDENTIAL_KEY,
  extractPaymentKeyFromAddress,
  extractStakeKeyFromAddress,
  isByronAddress,
  normalizeAddress,
  safeBigInt,
  safeDate,
} from "./utils";

const PAYMENT_HASH = "11".repeat(28);
const STAKE_HASH = "22".repeat(28);
// Real mainnet Byron-era (legacy) address.
const BYRON_ADDRESS = "Ae2tdPwUPEZFBgKrLT9pn8JPJVbefcL4kuznpQxQpxKfTVuHJ9gLAmxKk4w";

const baseAddress = new TyphonAddress.BaseAddress(
  TyphonTypes.NetworkId.MAINNET,
  { type: TyphonTypes.HashType.ADDRESS, hash: Buffer.from(PAYMENT_HASH, "hex") },
  { type: TyphonTypes.HashType.ADDRESS, hash: Buffer.from(STAKE_HASH, "hex") },
);
const enterpriseAddress = new TyphonAddress.EnterpriseAddress(TyphonTypes.NetworkId.MAINNET, {
  type: TyphonTypes.HashType.ADDRESS,
  hash: Buffer.from(PAYMENT_HASH, "hex"),
});
const rewardAddress = new TyphonAddress.RewardAddress(TyphonTypes.NetworkId.MAINNET, {
  type: TyphonTypes.HashType.ADDRESS,
  hash: Buffer.from(STAKE_HASH, "hex"),
});

describe("safeBigInt", () => {
  it("converts numeric-like values", () => {
    expect(safeBigInt("123")).toBe(123n);
    expect(safeBigInt(456)).toBe(456n);
  });

  it("returns 0n for nullish or empty input", () => {
    expect(safeBigInt(null)).toBe(0n);
    expect(safeBigInt(undefined)).toBe(0n);
    expect(safeBigInt("")).toBe(0n);
  });

  it("returns 0n for unparseable input", () => {
    expect(safeBigInt("not-a-number")).toBe(0n);
    expect(safeBigInt(1.5)).toBe(0n);
  });
});

describe("safeDate", () => {
  it("parses numeric and string timestamps", () => {
    expect(safeDate(0).toISOString()).toBe("1970-01-01T00:00:00.000Z");
    expect(safeDate("2023-06-01T00:00:00.000Z").toISOString()).toBe("2023-06-01T00:00:00.000Z");
  });

  it("falls back to epoch for invalid input", () => {
    expect(safeDate("definitely-not-a-date").getTime()).toBe(0);
    expect(safeDate({}).getTime()).toBe(0);
    expect(safeDate(undefined).getTime()).toBe(0);
  });
});

describe("normalizeAddress", () => {
  it("returns bech32 addresses unchanged", () => {
    const bech32 = baseAddress.getBech32();
    expect(normalizeAddress(bech32, isHexString)).toBe(bech32);
  });

  it("converts a hex-encoded address to bech32", () => {
    const bech32 = baseAddress.getBech32();
    const hex = TyphonUtils.getAddressFromString(bech32).getHex();
    expect(normalizeAddress(hex, isHexString)).toBe(bech32);
  });

  it("returns odd-length hex unchanged instead of silently truncating it", () => {
    // "abc" is all hex chars but odd-length: Buffer.from would drop the last nibble.
    const oddLengthHex = "abc";
    expect(normalizeAddress(oddLengthHex, isHexString)).toBe(oddLengthHex);
  });

  it("returns the original string when hex decoding fails instead of throwing", () => {
    const spy = jest.spyOn(TyphonUtils, "getAddressFromHex").mockImplementation(() => {
      throw new Error("bad hex address");
    });
    const hexInput = "abcdef";

    try {
      expect(() => normalizeAddress(hexInput, isHexString)).not.toThrow();
      expect(normalizeAddress(hexInput, isHexString)).toBe(hexInput);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("EMPTY_CREDENTIAL_KEY", () => {
  it("is a 28-byte (56 hex char) sentinel, matching a real credential-hash length", () => {
    expect(EMPTY_CREDENTIAL_KEY).toHaveLength(56);
  });
});

describe("isByronAddress", () => {
  it("returns true for a Byron-era address", () => {
    expect(isByronAddress(BYRON_ADDRESS)).toBe(true);
  });

  it("returns false for a Shelley base address", () => {
    expect(isByronAddress(baseAddress.getBech32())).toBe(false);
  });

  it("returns false for an unparseable address", () => {
    expect(isByronAddress("not-an-address")).toBe(false);
  });
});

describe("extractPaymentKeyFromAddress", () => {
  it("returns the payment credential hash for a base address", () => {
    expect(extractPaymentKeyFromAddress(baseAddress.getBech32())).toBe(PAYMENT_HASH);
  });

  it("returns the payment credential hash for an enterprise address", () => {
    expect(extractPaymentKeyFromAddress(enterpriseAddress.getBech32())).toBe(PAYMENT_HASH);
  });

  it("returns the empty credential key for a reward address (no payment credential)", () => {
    expect(extractPaymentKeyFromAddress(rewardAddress.getBech32())).toBe(EMPTY_CREDENTIAL_KEY);
  });

  it("returns the empty credential key for an unparseable address", () => {
    expect(extractPaymentKeyFromAddress("not-an-address")).toBe(EMPTY_CREDENTIAL_KEY);
  });
});

describe("extractStakeKeyFromAddress", () => {
  it("returns the stake credential hash for a base address", () => {
    expect(extractStakeKeyFromAddress(baseAddress.getBech32())).toBe(STAKE_HASH);
  });

  it("returns the stake credential hash for a reward address", () => {
    expect(extractStakeKeyFromAddress(rewardAddress.getBech32())).toBe(STAKE_HASH);
  });

  it("returns undefined for an enterprise address (no stake credential)", () => {
    expect(extractStakeKeyFromAddress(enterpriseAddress.getBech32())).toBeUndefined();
  });

  it("returns undefined for an unparseable address", () => {
    expect(extractStakeKeyFromAddress("not-an-address")).toBeUndefined();
  });
});
