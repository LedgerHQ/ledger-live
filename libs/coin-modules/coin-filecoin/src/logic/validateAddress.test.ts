import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  describe("valid addresses", () => {
    it("should return true for valid f1 address (SECP256K1)", () => {
      expect(validateAddress("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za")).toBe(true);
    });

    it("should return true for valid Ethereum address (converted to f4)", () => {
      // Ethereum addresses are converted to f4 delegated addresses
      expect(validateAddress("0x1234567890123456789012345678901234567890")).toBe(true);
    });

    it("should return true for another valid Ethereum-style address", () => {
      expect(validateAddress("0xabcdef1234567890abcdef1234567890abcdef12")).toBe(true);
    });
  });

  describe("invalid addresses", () => {
    it("should return false for empty string", () => {
      expect(validateAddress("")).toBe(false);
    });

    it("should return false for random string", () => {
      expect(validateAddress("notanaddress")).toBe(false);
    });

    it("should return false for incomplete address", () => {
      expect(validateAddress("f1")).toBe(false);
    });

    it("should return false for malformed f1 address", () => {
      expect(validateAddress("f1invalid")).toBe(false);
    });

    it("should return false for invalid checksum", () => {
      // Valid format but wrong checksum
      expect(validateAddress("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3zb")).toBe(false);
    });
  });
});
