import BigNumber from "bignumber.js";
import {
  baseUnitToKda,
  getPath,
  isError,
  isNoErrorReturnCode,
  kdaToBaseUnit,
  validateAddress,
} from "../../utils";
import { mockAddress } from "../fixtures/common.fixtures";

describe("Kadena utils", () => {
  describe("isNoErrorReturnCode", () => {
    it("should return true for 0x9000", () => {
      expect(isNoErrorReturnCode(0x9000)).toBe(true);
    });

    it("should return false for other codes", () => {
      expect(isNoErrorReturnCode(0x9001)).toBe(false);
      expect(isNoErrorReturnCode(0)).toBe(false);
    });
  });

  describe("getPath", () => {
    it("should add 'm/' prefix if missing", () => {
      expect(getPath("44'/626'/1'/0/0")).toBe("m/44'/626'/1'/0/0");
    });

    it("should not modify path if 'm/' is already present", () => {
      expect(getPath("m/44'/626'/1'/0/0")).toBe("m/44'/626'/1'/0/0");
    });
  });

  describe("Kadena addresses", () => {
    const invalidAddr = [
      "123",
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde",
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefg",
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg",
      "12345678-90abcdef-12345678-90abcdef-12345678-90abcdef-12345678-90abcdef",
    ];
    const validAddr = [
      "k:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      mockAddress,
    ];
    test("Check invalid addresses", () => {
      invalidAddr.forEach(addr => expect(validateAddress(addr)).toBe(false));
    });
    test("Check valid addresses", () => {
      validAddr.forEach(addr => expect(validateAddress(addr)).toBe(true));
    });
  });

  describe("kdaToBaseUnit", () => {
    it("should convert KDA to base unit", () => {
      expect(kdaToBaseUnit("1").toString()).toBe("1e-12");
      expect(kdaToBaseUnit(1).toString()).toBe("1e-12");
      expect(kdaToBaseUnit(new BigNumber(1)).toString()).toBe("1e-12");
    });
  });

  describe("baseUnitToKda", () => {
    it("should convert base unit to KDA", () => {
      expect(baseUnitToKda("1").toString()).toBe("1000000000000");
      expect(baseUnitToKda(1).toString()).toBe("1000000000000");
      expect(baseUnitToKda(new BigNumber(1)).toString()).toBe("1000000000000");
    });
  });

  describe("isError", () => {
    it("should throw an error for non-zero return codes", () => {
      expect(() => isError({ return_code: 0x9001, error_message: "Test error" })).toThrow(
        "36865 - Test error",
      );
    });

    it("should not throw an error for zero return code", () => {
      expect(() => isError({ return_code: 0x9000, error_message: "" })).not.toThrow();
    });
  });
});
