import { ResponseAddress } from "@zondax/ledger-stacks";
import {
  isValidHex,
  isValidBase64,
  isNoErrorReturnCode,
  getPath,
  throwIfError,
  getBufferFromString,
} from "./utils";

describe("Stacks utils", () => {
  describe("isValidHex", () => {
    test("should return true for valid hex strings", () => {
      expect(isValidHex("0x1234")).toBe(true);
      expect(isValidHex("1234")).toBe(true);
      expect(isValidHex("abcdef")).toBe(true);
      expect(isValidHex("ABCDEF")).toBe(true);
      expect(isValidHex("1a2b3c")).toBe(true);
    });

    test("should return false for invalid hex strings", () => {
      expect(isValidHex("0x123")).toBe(false); // Odd length
      expect(isValidHex("123g")).toBe(false); // Invalid character
      expect(isValidHex("")).toBe(false); // Empty string
      expect(isValidHex("hello world")).toBe(false); // Not hex
    });
  });

  describe("isValidBase64", () => {
    test("should return true for valid base64 strings", () => {
      expect(isValidBase64("aGVsbG8=")).toBe(true); // "hello"
      expect(isValidBase64("dGVzdA==")).toBe(true); // "test"
      expect(isValidBase64("Zm9vYmFy")).toBe(true); // "foobar"
      expect(isValidBase64("")).toBe(true); // Empty string is valid base64
    });

    test("should return false for invalid base64 strings", () => {
      expect(isValidBase64("aGVsbG8==")).toBe(false); // Invalid padding
      expect(isValidBase64("hello world")).toBe(false); // Not base64
      expect(isValidBase64("!@#$%^")).toBe(false); // Invalid characters
    });
  });

  describe("isNoErrorReturnCode", () => {
    test("should return true for success code 0x9000", () => {
      expect(isNoErrorReturnCode(0x9000)).toBe(true);
    });

    test("should return false for other codes", () => {
      expect(isNoErrorReturnCode(0x6985)).toBe(false);
      expect(isNoErrorReturnCode(0x6a80)).toBe(false);
      expect(isNoErrorReturnCode(0)).toBe(false);
    });
  });

  describe("getPath", () => {
    test("should add 'm/' prefix if not present", () => {
      expect(getPath("44'/5757'/0'/0/0")).toBe("m/44'/5757'/0'/0/0");
      expect(getPath("1/2/3")).toBe("m/1/2/3");
    });

    test("should not modify path if 'm/' prefix is already present", () => {
      expect(getPath("m/44'/5757'/0'/0/0")).toBe("m/44'/5757'/0'/0/0");
      expect(getPath("m/1/2/3")).toBe("m/1/2/3");
    });

    test("should handle empty path", () => {
      expect(getPath("")).toBe(""); // Should not modify empty strings
    });
  });

  describe("throwIfError", () => {
    test("should not throw error for success code", () => {
      const response = {
        returnCode: 0x9000,
        errorMessage: "",
        address: "SP123456789ABCDEF",
      } as ResponseAddress;

      expect(() => throwIfError(response)).not.toThrow();
    });

    test("should throw error for error code", () => {
      const response = {
        returnCode: 0x6985,
        errorMessage: "Condition not satisfied",
        address: "",
      } as ResponseAddress;

      expect(() => throwIfError(response)).toThrow("27013 - Condition not satisfied");
    });
  });

  describe("getBufferFromString", () => {
    test("should convert hex string to buffer", () => {
      const hexString = "48656c6c6f"; // "Hello" in hex
      const buffer = getBufferFromString(hexString);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe("Hello");
    });

    test("should convert 0x-prefixed hex string to buffer", () => {
      const hexString = "0x48656c6c6f"; // "Hello" in hex with 0x prefix
      const buffer = getBufferFromString(hexString);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe("Hello");
    });

    test("should convert base64 string to buffer", () => {
      const base64String = "SGVsbG8="; // "Hello" in base64
      const buffer = getBufferFromString(base64String);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe("Hello");
    });

    test("should convert plain string to buffer", () => {
      const plainString = "Hello";
      const buffer = getBufferFromString(plainString);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe("Hello");
    });
  });
});
