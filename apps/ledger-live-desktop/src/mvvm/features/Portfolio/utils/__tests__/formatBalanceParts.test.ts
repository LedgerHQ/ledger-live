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
  describe("with USD unit and ticker", () => {
    it("should split balance into integer, separator, and decimal parts with $ symbol", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: 136491,
        locale: "en-US",
        discreet: false,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toBe("$1,364");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("91");
    });

    it("should handle balance without thousands separator", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: 12345,
        locale: "en-US",
        discreet: false,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toBe("$123");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("45");
    });

    it("should handle zero balance", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: 0,
        locale: "en-US",
        discreet: false,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toBe("$0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("00");
    });

    it("should handle large balance with multiple thousands separators", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: 123456789,
        locale: "en-US",
        discreet: false,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toBe("$1,234,567");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("89");
    });
  });

  describe("with EUR unit and ticker", () => {
    it("should format balance with euro symbol", () => {
      const result = formatBalanceParts({
        unit: mockEurUnit,
        balance: 136491,
        locale: "en-US",
        discreet: false,
        currencyTicker: "EUR",
      });

      expect(result.integerPart).toContain("€");
      expect(result.integerPart).toContain("1,364");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("91");
    });
  });

  describe("with discreet mode", () => {
    it("should return masked value when discreet is true", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: 136491,
        locale: "en-US",
        discreet: true,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toBe("***");
      expect(result.decimalSeparator).toBe("");
      expect(result.decimalDigits).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should handle negative balance", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: -12345,
        locale: "en-US",
        discreet: false,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toContain("-");
      expect(result.integerPart).toContain("$");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("45");
    });

    it("should handle small balance less than 1", () => {
      const result = formatBalanceParts({
        unit: mockUsdUnit,
        balance: 50,
        locale: "en-US",
        discreet: false,
        currencyTicker: "USD",
      });

      expect(result.integerPart).toBe("$0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("50");
    });

    it("should fallback to unit.code when no valid currency ticker", () => {
      const mockBtcUnit = {
        name: "Bitcoin",
        code: "BTC",
        magnitude: 8,
        showAllDigits: false,
        prefixCode: false,
      };

      const result = formatBalanceParts({
        unit: mockBtcUnit,
        balance: 12345678,
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toBeDefined();
      expect(result.integerPart).toContain("BTC");
    });
  });
});
