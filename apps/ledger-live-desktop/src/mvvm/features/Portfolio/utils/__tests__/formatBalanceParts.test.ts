import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatBalanceParts } from "../formatBalanceParts";

// Test fixtures
const createUnit = (overrides: Partial<Unit> = {}): Unit => ({
  name: "US Dollar",
  code: "$",
  magnitude: 2,
  showAllDigits: false,
  prefixCode: true,
  ...overrides,
});

const USD_UNIT = createUnit();

const EUR_UNIT = createUnit({
  name: "Euro",
  code: "€",
  prefixCode: false,
});

const BTC_UNIT = createUnit({
  name: "Bitcoin",
  code: "BTC",
  magnitude: 8,
  prefixCode: false,
});

const ETH_UNIT = createUnit({
  name: "Ether",
  code: "ETH",
  magnitude: 18,
  prefixCode: false,
});

describe("formatBalanceParts", () => {
  describe("discreet mode", () => {
    it("returns masked value when discreet is enabled", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(136491),
        locale: "en-US",
        discreet: true,
      });

      expect(result).toEqual({
        integerPart: "***",
        decimalSeparator: "",
        decimalDigits: "",
      });
    });

    it("ignores balance value when discreet is enabled", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(0),
        locale: "en-US",
        discreet: true,
      });

      expect(result.integerPart).toBe("***");
    });
  });

  describe("currency position", () => {
    describe("prefix currency (USD)", () => {
      it("includes currency symbol in integer part", () => {
        const result = formatBalanceParts({
          unit: USD_UNIT,
          balance: new BigNumber(136491),
          locale: "en-US",
          discreet: false,
        });

        expect(result.integerPart).toBe("$1,364");
        expect(result.decimalSeparator).toBe(".");
        expect(result.decimalDigits).toBe("91");
      });
    });

    describe("suffix currency (EUR)", () => {
      it("includes currency symbol in decimal part", () => {
        const result = formatBalanceParts({
          unit: EUR_UNIT,
          balance: new BigNumber(136491),
          locale: "en-US",
          discreet: false,
        });

        expect(result.integerPart).toBe("1,364");
        expect(result.decimalSeparator).toBe(".");
        expect(result.decimalDigits).toContain("91");
        expect(result.decimalDigits).toContain("€");
      });
    });
  });

  describe("thousands separators", () => {
    it("formats value without thousands separator", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(12345),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toBe("$123");
      expect(result.decimalDigits).toBe("45");
    });

    it("formats value with single thousands separator", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(136491),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toBe("$1,364");
    });
  });

  describe("decimal handling", () => {
    it("formats fractional values correctly", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(99),
        locale: "en-US",
        discreet: false,
      });

      // 99 cents = 0.99 USD
      expect(result.integerPart).toBe("$0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toBe("99");
    });

    it("formats zero balance", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(0),
        locale: "en-US",
        discreet: false,
      });

      expect(result.integerPart).toContain("0");
    });

    it("formats whole number values", () => {
      const result = formatBalanceParts({
        unit: USD_UNIT,
        balance: new BigNumber(100),
        locale: "en-US",
        discreet: false,
      });

      // 100 cents = 1.00 USD
      expect(result.integerPart).toBe("$1");
    });
  });

  describe("cryptocurrency units", () => {
    it("formats BTC with decimal magnitude", () => {
      const result = formatBalanceParts({
        unit: BTC_UNIT,
        balance: new BigNumber(12345678),
        locale: "en-US",
        discreet: false,
      });

      // 12345678 satoshis = 0.12345678 BTC
      expect(result.integerPart).toBe("0");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toContain("BTC");
    });

    it("formats whole ETH value", () => {
      const result = formatBalanceParts({
        unit: ETH_UNIT,
        balance: new BigNumber("1000000000000000000"),
        locale: "en-US",
        discreet: false,
      });

      // 1e18 wei = 1 ETH (whole number, no decimals)
      expect(result.integerPart).toBe("1");
      // For whole numbers with suffix currency, currency is in integerPart when no decimals
    });

    it("formats fractional ETH value", () => {
      const result = formatBalanceParts({
        unit: ETH_UNIT,
        balance: new BigNumber("1500000000000000000"),
        locale: "en-US",
        discreet: false,
      });

      // 1.5e18 wei = 1.5 ETH
      expect(result.integerPart).toBe("1");
      expect(result.decimalSeparator).toBe(".");
      expect(result.decimalDigits).toContain("5");
      expect(result.decimalDigits).toContain("ETH");
    });

    it("formats large crypto balance", () => {
      const result = formatBalanceParts({
        unit: BTC_UNIT,
        balance: new BigNumber("100000000000"),
        locale: "en-US",
        discreet: false,
      });

      // 100000000000 satoshis = 1000 BTC
      expect(result.integerPart).toBe("1,000");
    });
  });

  describe("locale handling", () => {
    it("uses locale-specific decimal separator for French", () => {
      const result = formatBalanceParts({
        unit: EUR_UNIT,
        balance: new BigNumber(136491),
        locale: "fr-FR",
        discreet: false,
      });

      expect(result.decimalSeparator).toBe(",");
    });

    it("uses locale-specific thousands separator for German", () => {
      const result = formatBalanceParts({
        unit: EUR_UNIT,
        balance: new BigNumber(123456789),
        locale: "de-DE",
        discreet: false,
      });

      expect(result.integerPart).toContain(".");
    });
  });
});
