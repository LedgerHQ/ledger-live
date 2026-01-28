import {
  validateAddress,
  isFilEthAddress,
  isIdAddress,
  isEthereumConvertableAddr,
  isRecipientValidForTokenTransfer,
  getEquivalentAddress,
  convertAddressFilToEth,
  convertAddressEthToFil,
} from "./addresses";
import { fromString, fromEthAddress } from "iso-filecoin/address";

jest.mock("@ledgerhq/logs");

// Valid test addresses
const VALID_F1 = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
const VALID_ETH = "0x1234567890123456789012345678901234567890";
const VALID_F410 = "f410fgxvtrr5z5fjbmgxraxqk3x5xvlbqcwkxlyxvma"; // f410 delegated address

describe("addresses", () => {
  describe("validateAddress", () => {
    it("should validate a valid f1 address", () => {
      const result = validateAddress(VALID_F1);
      expect(result.isValid).toBe(true);
    });

    it("should validate a valid Ethereum address", () => {
      const result = validateAddress(VALID_ETH);
      expect(result.isValid).toBe(true);
    });

    it("should invalidate an empty string", () => {
      const result = validateAddress("");
      expect(result.isValid).toBe(false);
    });

    it("should invalidate a random invalid string", () => {
      const result = validateAddress("invalid-address");
      expect(result.isValid).toBe(false);
    });

    it("should invalidate a malformed f1 address", () => {
      const result = validateAddress("f1invalid");
      expect(result.isValid).toBe(false);
    });

    it("should invalidate a short ethereum address", () => {
      const result = validateAddress("0x123");
      expect(result.isValid).toBe(false);
    });
  });

  describe("isFilEthAddress", () => {
    it("should return true for f410 delegated address", () => {
      const addr = fromEthAddress(VALID_ETH, "mainnet");
      expect(isFilEthAddress(addr)).toBe(true);
    });

    it("should return false for f1 address", () => {
      const addr = fromString(VALID_F1);
      expect(isFilEthAddress(addr)).toBe(false);
    });
  });

  describe("isIdAddress", () => {
    it("should return true for f0 ID address", () => {
      const addr = fromString("f01234");
      expect(isIdAddress(addr)).toBe(true);
    });

    it("should return false for f1 address", () => {
      const addr = fromString(VALID_F1);
      expect(isIdAddress(addr)).toBe(false);
    });
  });

  describe("isEthereumConvertableAddr", () => {
    it("should return true for f0 ID address", () => {
      const addr = fromString("f01234");
      expect(isEthereumConvertableAddr(addr)).toBe(true);
    });

    it("should return true for f410 delegated address", () => {
      const addr = fromEthAddress(VALID_ETH, "mainnet");
      expect(isEthereumConvertableAddr(addr)).toBe(true);
    });

    it("should return false for f1 address", () => {
      const addr = fromString(VALID_F1);
      expect(isEthereumConvertableAddr(addr)).toBe(false);
    });
  });

  describe("isRecipientValidForTokenTransfer", () => {
    it("should return true for valid Ethereum address", () => {
      expect(isRecipientValidForTokenTransfer(VALID_ETH)).toBe(true);
    });

    it("should return true for f0 ID address", () => {
      expect(isRecipientValidForTokenTransfer("f01234")).toBe(true);
    });

    it("should return false for f1 address", () => {
      expect(isRecipientValidForTokenTransfer(VALID_F1)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isRecipientValidForTokenTransfer("")).toBe(false);
    });

    it("should return false for single character", () => {
      expect(isRecipientValidForTokenTransfer("a")).toBe(false);
    });

    it("should return false for invalid address", () => {
      expect(isRecipientValidForTokenTransfer("invalid")).toBe(false);
    });
  });

  describe("getEquivalentAddress", () => {
    it("should convert Ethereum address to f410 format", () => {
      const result = getEquivalentAddress(VALID_ETH);
      expect(result).toMatch(/^f410/);
    });

    it("should convert f0 ID address to Ethereum format", () => {
      const result = getEquivalentAddress("f01234");
      expect(result).toMatch(/^0x/);
    });

    it("should return empty string for f1 address (not convertible)", () => {
      const result = getEquivalentAddress(VALID_F1);
      expect(result).toBe("");
    });
  });

  describe("convertAddressFilToEth", () => {
    it("should return Ethereum address unchanged", () => {
      const result = convertAddressFilToEth(VALID_ETH);
      expect(result).toBe(VALID_ETH);
    });

    it("should convert f0 ID address to Ethereum format", () => {
      const result = convertAddressFilToEth("f01234");
      expect(result).toMatch(/^0x/);
    });

    it("should throw for non-convertible f1 address", () => {
      expect(() => convertAddressFilToEth(VALID_F1)).toThrow(
        "address is not convertible to ethereum address",
      );
    });
  });

  describe("convertAddressEthToFil", () => {
    it("should convert Ethereum address to f410 format", () => {
      const result = convertAddressEthToFil(VALID_ETH);
      expect(result).toMatch(/^f410/);
    });

    it("should return non-Ethereum address unchanged", () => {
      const result = convertAddressEthToFil(VALID_F1);
      expect(result).toBe(VALID_F1);
    });
  });
});
