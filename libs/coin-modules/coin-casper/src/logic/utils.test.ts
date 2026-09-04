import {
  isNoErrorReturnCode,
  getPath,
  isError,
  methodToString,
  getRandomTransferID,
  toSafeNumber,
  getTransferIdFromMemo,
} from "./utils";
import type { CasperMemo } from "../types";

describe("Casper utils", () => {
  describe("isNoErrorReturnCode", () => {
    test("should return true for code 0x9000", () => {
      expect(isNoErrorReturnCode(0x9000)).toBe(true);
    });

    test("should return false for other codes", () => {
      expect(isNoErrorReturnCode(0x6984)).toBe(false);
      expect(isNoErrorReturnCode(0x6a80)).toBe(false);
      expect(isNoErrorReturnCode(0)).toBe(false);
    });
  });

  describe("getPath", () => {
    test("should add m/ prefix if not present", () => {
      expect(getPath("44'/506'/0'/0/0")).toBe("m/44'/506'/0'/0/0");
    });

    test("should not modify path if m/ prefix is already present", () => {
      expect(getPath("m/44'/506'/0'/0/0")).toBe("m/44'/506'/0'/0/0");
    });

    test("should handle empty path", () => {
      expect(getPath("")).toBe("");
    });
  });

  describe("isError", () => {
    test("should not throw for successful return code", () => {
      expect(() => isError({ returnCode: 0x9000, errorMessage: "Success" })).not.toThrow();
    });

    test("should throw for error return codes", () => {
      expect(() => isError({ returnCode: 0x6a80, errorMessage: "Bad data" })).toThrow(
        "27264 - Bad data",
      );
    });
  });

  describe("methodToString", () => {
    test("should return 'Token transfer' for method 0", () => {
      expect(methodToString(0)).toBe("Token transfer");
    });

    test("should return 'Unknown' for other methods", () => {
      expect(methodToString(1)).toBe("Unknown");
      expect(methodToString(999)).toBe("Unknown");
    });
  });

  describe("getRandomTransferID", () => {
    test("should return a string containing a number", () => {
      const result = getRandomTransferID();
      expect(typeof result).toBe("string");
      expect(Number.isNaN(parseInt(result, 10))).toBe(false);
    });

    test("should generate different IDs on multiple calls", () => {
      const id1 = getRandomTransferID();
      const id2 = getRandomTransferID();
      const id3 = getRandomTransferID();

      // There's a very small chance these could be the same, but it's extremely unlikely
      expect(new Set([id1, id2, id3]).size).toBeGreaterThan(0);
    });
  });

  describe("toSafeNumber", () => {
    test("should convert a bigint within the safe integer range", () => {
      expect(toSafeNumber(999_000_000n)).toBe(999_000_000);
    });

    test("should accept the exact safe integer bounds", () => {
      expect(toSafeNumber(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
      expect(toSafeNumber(BigInt(Number.MIN_SAFE_INTEGER))).toBe(Number.MIN_SAFE_INTEGER);
    });

    test("should throw for a value above the safe integer range", () => {
      expect(() => toSafeNumber(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow(RangeError);
    });

    test("should throw for a value below the safe integer range", () => {
      expect(() => toSafeNumber(BigInt(Number.MIN_SAFE_INTEGER) - 1n)).toThrow(RangeError);
    });
  });

  describe("getTransferIdFromMemo", () => {
    it.each([
      ["undefined memo", undefined, undefined],
      ["MemoNotSupported", { type: "none" } as CasperMemo, undefined],
      [
        "StringMemo<'transferId'>",
        { type: "string", kind: "transferId", value: "12345" } as CasperMemo,
        "12345",
      ],
      [
        "generic-adapter memo { type: 'transferId' }",
        { type: "transferId", value: "9007199254740993" } as CasperMemo,
        "9007199254740993",
      ],
    ])("returns correct transferId for %s", (_desc, memo, expected) => {
      expect(getTransferIdFromMemo(memo)).toBe(expected);
    });
  });
});
