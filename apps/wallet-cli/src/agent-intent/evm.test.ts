import { describe, expect, it } from "bun:test";
import {
  parseAmountWithTicker,
  parseDecimalAmount,
  parseEvmAddress,
  toChecksumAddress,
} from "./evm";

// The EIP-55 specification's own test vectors.
const EIP55_VECTORS = [
  "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
  "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
  "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
  "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
];

describe("toChecksumAddress", () => {
  it.each(EIP55_VECTORS)("reproduces the EIP-55 vector %s", vector => {
    expect(toChecksumAddress(vector.toLowerCase())).toBe(vector);
  });
});

describe("parseEvmAddress", () => {
  it("accepts a correctly checksummed address unchanged", () => {
    expect(parseEvmAddress(EIP55_VECTORS[0], "to")).toBe(EIP55_VECTORS[0]);
  });

  it("accepts all-lowercase and all-uppercase addresses and returns them checksummed", () => {
    expect(parseEvmAddress(EIP55_VECTORS[1].toLowerCase(), "to")).toBe(EIP55_VECTORS[1]);
    expect(parseEvmAddress(`0x${EIP55_VECTORS[1].slice(2).toUpperCase()}`, "to")).toBe(
      EIP55_VECTORS[1],
    );
  });

  it("rejects a mixed-case address whose checksum doesn't match (a likely typo)", () => {
    const flipped = EIP55_VECTORS[0].replace("aAeb", "aaEb");

    expect(() => parseEvmAddress(flipped, "to")).toThrow(/--to .*invalid EIP-55 checksum/);
  });

  it.each([
    ["missing 0x prefix", EIP55_VECTORS[0].slice(2)],
    ["too short", "0x1234"],
    ["too long", `${EIP55_VECTORS[0]}00`],
    ["non-hex characters", "0xZZZeb6053F3E94C9b9A09f33669435E7Ef1BeAed"],
    ["an ENS name", "vitalik.eth"],
    ["empty", ""],
  ])("rejects %s", (_label, value) => {
    expect(() => parseEvmAddress(value, "from")).toThrow(/--from .*is not an EVM address/);
  });
});

describe("parseDecimalAmount", () => {
  it("converts a decimal amount to exact base units", () => {
    expect(parseDecimalAmount("0.01", 18, "ETH")).toBe(10_000_000_000_000_000n);
    expect(parseDecimalAmount("25", 6, "USDC")).toBe(25_000_000n);
    expect(parseDecimalAmount("1.5", 6, "USDC")).toBe(1_500_000n);
  });

  it("keeps full precision where a float would not", () => {
    // 0.1 + 0.2 style drift, and a value past Number.MAX_SAFE_INTEGER in base units.
    expect(parseDecimalAmount("0.3", 18, "ETH")).toBe(300_000_000_000_000_000n);
    expect(parseDecimalAmount("123456789.123456789123456789", 18, "ETH")).toBe(
      123_456_789_123_456_789_123_456_789n,
    );
  });

  it("accepts the smallest unit and the largest uint256 value", () => {
    expect(parseDecimalAmount("0.000000000000000001", 18, "ETH")).toBe(1n);
    const max = ((1n << 256n) - 1n).toString();
    expect(parseDecimalAmount(max, 0, "RAW")).toBe((1n << 256n) - 1n);
  });

  it("rejects more decimal places than the asset supports instead of rounding", () => {
    expect(() => parseDecimalAmount("1.0000001", 6, "USDC")).toThrow(
      /7 decimal places, but USDC supports at most 6/,
    );
  });

  it("rejects zero", () => {
    expect(() => parseDecimalAmount("0", 18, "ETH")).toThrow(/greater than zero/);
    expect(() => parseDecimalAmount("0.000", 18, "ETH")).toThrow(/greater than zero/);
  });

  it("rejects values above uint256", () => {
    expect(() => parseDecimalAmount((1n << 256n).toString(), 0, "RAW")).toThrow(/too large/);
  });

  it.each(["-1", "1e18", ".5", "5.", "1,5", "0x10", "", "abc", " 1"])(
    "rejects the non-plain-decimal %p",
    text => {
      expect(() => parseDecimalAmount(text, 18, "ETH")).toThrow(/not a plain decimal number/);
    },
  );
});

describe("parseAmountWithTicker", () => {
  it("accepts amount-then-ticker and ticker-then-amount", () => {
    expect(parseAmountWithTicker("0.01 ETH")).toEqual({ amount: "0.01", ticker: "ETH" });
    expect(parseAmountWithTicker("USDC 25")).toEqual({ amount: "25", ticker: "USDC" });
  });

  it("tolerates surrounding and repeated whitespace", () => {
    expect(parseAmountWithTicker("  0.5   ETH ")).toEqual({ amount: "0.5", ticker: "ETH" });
  });

  it("accepts tickers that start with a digit", () => {
    expect(parseAmountWithTicker("3 1INCH")).toEqual({ amount: "3", ticker: "1INCH" });
  });

  it.each(["0.01", "ETH", "0.01 ETH extra", "1 2", "ETH USDC", ""])("rejects %p", input => {
    expect(() => parseAmountWithTicker(input)).toThrow(/must be an amount and a ticker/);
  });
});
