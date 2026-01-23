import { BigNumber } from "bignumber.js";
import { formatBalanceParts } from "../formatBalanceParts";

const mockUsdUnit = {
  name: "US Dollar",
  code: "$",
  magnitude: 2,
  showAllDigits: false,
  prefixCode: true,
};

const mockEurUnit = {
  name: "Euro",
  code: "€",
  magnitude: 2,
  showAllDigits: false,
  prefixCode: false,
};

describe("formatBalanceParts", () => {
  describe("with USD unit", () => {
    it("should split balance into integer, separator, and decimal parts with currency symbol", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: new BigNumber(136491),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toContain("$");
      expect(result.integerPart).toContain("1,364");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("91");
    });

    it("should handle balance without thousands separator", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: new BigNumber(12345),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toContain("$");
      expect(result.integerPart).toContain("123");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("45");
    });

    it("should handle zero balance with 2 decimal places", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: new BigNumber(0),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toContain("$");
      expect(result.integerPart).toContain("0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("00");
    });

    it("should handle large balance with multiple thousands separators", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: new BigNumber(123456789),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toContain("$");
      expect(result.integerPart).toContain("1,234,567");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("89");
    });
  });

  describe("with EUR unit", () => {
    it("should format balance with euro symbol", () => {
      const result = formatBalanceParts({
        unit: mockEurUnit,
        balance: new BigNumber(136491),
        locale: "en-US",
        discreet: false,
      });

      // EUR with prefixCode: false puts symbol after the value
      expect(result.integerPart).toContain("1,364");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toContain("91");
      expect(result.decimalDigits).toContain("€");
    });
  });

  describe("with discreet mode", () => {
    it("should return masked value when discreet is true", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: new BigNumber(136491),
        locale: "en-US",
        discreet: true,
      });

      expect(result.integerPart).toBe("***");
      expect(result.decimalSeparator).toBe("");
      expect(result.decimalDigits).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should handle small balance less than 1 with 2 decimal places", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: new BigNumber(50),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toContain("$");
      expect(result.integerPart).toContain("0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("50");
    });

    it("should format BTC balance correctly with max 6 decimal digits for crypto", () => {
      const mockBtcUnit = {
        name: "Bitcoin",
        code: "BTC",
        magnitude: 8,
        showAllDigits: false,
        prefixCode: false,
      };

      const result = formatBalanceParts({
        unit: mockBtcUnit,
        balance: new BigNumber(12345678),
        locale: "en-US",
        discreet: false,
        isFiat: false,
      });

      // 12345678 satoshis = 0.12345678 BTC
      // With isFiat: false, should limit to 6 decimal digits max
      // With prefixCode: false, BTC is appended after the value
      expect(result.integerPart).toBe("0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toContain("BTC");
      // Should have max 6 digits (excluding the currency code)
      const digitsOnly = result.decimalDigits.replace(/[^0-9]/g, "");
      expect(digitsOnly.length).toBeLessThanOrEqual(6);
    });
  });
});
