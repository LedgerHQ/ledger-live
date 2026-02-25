import BigNumber from "bignumber.js";
import { convertNumberDecimals, isSameTokenAsFee, normalizeAndSubtract } from "../../bridge/utils";

describe("utils", () => {
  describe("convertFeeDecimals", () => {
    it("should return the same value when target decimals is 18", () => {
      const feeInWei = new BigNumber("1000000000000000000"); // 1 CELO in Wei
      const result = convertNumberDecimals(feeInWei, 18);
      expect(result).toEqual(feeInWei);
    });

    it("should convert from 18 decimals to 6 decimals (USDC)", () => {
      const feeInWei = new BigNumber("1000000000000000000"); // 1 CELO in Wei
      const result = convertNumberDecimals(feeInWei, 6);
      expect(result).toEqual(new BigNumber("1000000")); // 1 USDC in 6 decimals
    });

    it("should handle small fee amounts correctly", () => {
      const feeInWei = new BigNumber("100000000000000"); // 0.0001 CELO in Wei
      const result = convertNumberDecimals(feeInWei, 6);
      expect(result).toEqual(new BigNumber("100")); // 0.0001 USDC in 6 decimals
    });

    it("should handle large fee amounts correctly", () => {
      const feeInWei = new BigNumber("10000000000000000000"); // 10 CELO in Wei
      const result = convertNumberDecimals(feeInWei, 6);
      expect(result).toEqual(new BigNumber("10000000")); // 10 USDC in 6 decimals
    });

    it("should handle zero fee", () => {
      const feeInWei = new BigNumber("0");
      const result = convertNumberDecimals(feeInWei, 6);
      expect(result).toEqual(new BigNumber("0"));
    });

    it("should convert from 18 decimals to 8 decimals", () => {
      const feeInWei = new BigNumber("1000000000000000000"); // 1 CELO in Wei
      const result = convertNumberDecimals(feeInWei, 8);
      expect(result).toEqual(new BigNumber("100000000")); // 1 token in 8 decimals
    });

    it("should handle fractional results", () => {
      const feeInWei = new BigNumber("1500000000000000000"); // 1.5 CELO in Wei
      const result = convertNumberDecimals(feeInWei, 6);
      expect(result).toEqual(new BigNumber("1500000")); // 1.5 USDC in 6 decimals
    });
  });

  describe("isSameTokenAsFee", () => {
    it("should return true when token contract address matches fee currency", () => {
      const result = isSameTokenAsFee(
        true,
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
      );
      expect(result).toBe(true);
    });

    it("should return false when token contract address does not match fee currency", () => {
      const result = isSameTokenAsFee(
        true,
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
        "0x617f3112bf5397d0467d315cc709ef968d9ba546",
      );
      expect(result).toBe(false);
    });

    it("should return false when feeCurrency is null", () => {
      const result = isSameTokenAsFee(true, "0xceba9300f2b948710d2653dd7b07f33a8b32118c", null);
      expect(result).toBe(false);
    });

    it("should return false when feeCurrency is undefined", () => {
      const result = isSameTokenAsFee(
        true,
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
        undefined,
      );
      expect(result).toBe(false);
    });

    it("should handle case-insensitive comparison", () => {
      const result = isSameTokenAsFee(
        true,
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
        "0xCEBA9300F2B948710D2653DD7B07F33A8B32118C",
      );
      expect(result).toBe(true);
    });

    it("should handle addresses without 0x prefix", () => {
      const result = isSameTokenAsFee(
        true,
        "ceba9300f2b948710d2653dd7b07f33a8b32118c",
        "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
      );
      expect(result).toBe(true);
    });
  });

  describe("normalizeAndSubtract", () => {
    it("should convert 6-decimal balance to 18-decimal Wei and subtract", () => {
      const balance = new BigNumber("1000000"); // 1 USDC in 6 decimals
      const amount = new BigNumber("500000000000000000"); // 0.5 USDC in Wei (18 decimals)
      const result = normalizeAndSubtract(balance, amount, 6);
      // 1 USDC = 1000000000000000000 Wei
      // 1000000000000000000 - 500000000000000000 = 500000000000000000
      expect(result).toEqual(new BigNumber("500000000000000000"));
    });

    it("should handle zero balance", () => {
      const balance = new BigNumber("0");
      const amount = new BigNumber("100000000000000000");
      const result = normalizeAndSubtract(balance, amount, 6);
      expect(result).toEqual(new BigNumber("-100000000000000000"));
    });

    it("should handle zero amount", () => {
      const balance = new BigNumber("1000000"); // 1 USDC in 6 decimals
      const amount = new BigNumber("0");
      const result = normalizeAndSubtract(balance, amount, 6);
      expect(result).toEqual(new BigNumber("1000000000000000000")); // 1 USDC in Wei
    });

    it("should handle large balances", () => {
      const balance = new BigNumber("1000000000000"); // 1,000,000 USDC in 6 decimals
      const amount = new BigNumber("1000000000000000000"); // 1 USDC in Wei
      const result = normalizeAndSubtract(balance, amount, 6);
      // 1000000000000 * 10^12 - 1000000000000000000 = 999999000000000000000000
      expect(result).toEqual(new BigNumber("999999000000000000000000"));
    });

    it("should handle result where balance equals amount after normalization", () => {
      const balance = new BigNumber("1000000"); // 1 USDC in 6 decimals
      const amount = new BigNumber("1000000000000000000"); // 1 USDC in Wei
      const result = normalizeAndSubtract(balance, amount, 6);
      expect(result).toEqual(new BigNumber("0"));
    });

    it("should handle fractional amounts", () => {
      const balance = new BigNumber("1000000"); // 1 USDC in 6 decimals
      const amount = new BigNumber("250000000000000000"); // 0.25 USDC in Wei
      const result = normalizeAndSubtract(balance, amount, 6);
      expect(result).toEqual(new BigNumber("750000000000000000")); // 0.75 USDC in Wei
    });

    it("should handle small balances", () => {
      const balance = new BigNumber("1"); // 0.000001 USDC in 6 decimals
      const amount = new BigNumber("500000000000"); // 0.0000005 USDC in Wei
      const result = normalizeAndSubtract(balance, amount, 6);
      expect(result).toEqual(new BigNumber("500000000000")); // 0.0000005 USDC in Wei
    });
  });
});
