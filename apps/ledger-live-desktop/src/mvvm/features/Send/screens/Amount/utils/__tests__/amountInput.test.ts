import { BigNumber } from "bignumber.js";
import {
  formatAmountForInput,
  formatFiatForInput,
  processRawInput,
  processFiatInput,
  calculateFiatEquivalent,
  shouldSyncInput,
} from "../amountInput";

const mockUnit = {
  code: "BTC",
  name: "bitcoin",
  magnitude: 8,
  symbol: "₿",
};

const mockFiatUnit = {
  code: "USD",
  name: "US Dollar",
  magnitude: 2,
  symbol: "$",
};

describe("amountInput utils", () => {
  describe("formatAmountForInput", () => {
    it("returns empty string for zero amount", () => {
      expect(formatAmountForInput(mockUnit, new BigNumber(0), "en-US")).toBe("");
    });

    it("formats non-zero amount without grouping", () => {
      // formatCurrencyUnit expects atomic values (sats for BTC)
      const result = formatAmountForInput(mockUnit, new BigNumber("123456789"), "en-US");
      expect(result).toBe("1.23456789");
    });
  });

  describe("formatFiatForInput", () => {
    it("returns empty string for zero amount", () => {
      expect(formatFiatForInput(mockFiatUnit, new BigNumber(0), "en-US")).toBe("");
    });

    it("clamps and trims fiat amount", () => {
      // formatCurrencyUnit expects atomic values (cents for USD)
      const result = formatFiatForInput(mockFiatUnit, new BigNumber("123456"), "en-US");
      expect(result).toBe("1234.56");
    });

    it("removes trailing zeros", () => {
      // 100.00 USD
      const result = formatFiatForInput(mockFiatUnit, new BigNumber("10000"), "en-US");
      expect(result).toBe("100");
    });
  });

  describe("processRawInput", () => {
    it("processes valid input", () => {
      const result = processRawInput("123.456", mockUnit, "en-US");
      expect(result.value.toString()).toBe("12345600000");
      expect(result.display).toBe("123.456");
    });

    it("handles empty input", () => {
      const result = processRawInput("", mockUnit, "en-US");
      expect(result.value.toString()).toBe("0");
      expect(result.display).toBe("");
    });

    it("handles invalid input", () => {
      const result = processRawInput("abc", mockUnit, "en-US");
      expect(result.value.toString()).toBe("0");
    });
  });

  describe("processFiatInput", () => {
    it("processes and clamps fiat input", () => {
      const result = processFiatInput("123.456", mockFiatUnit, "en-US");
      expect(result.clampedDisplay).toBe("123.45");
      expect(result.value.toString()).toBe("12345");
      expect(typeof result.isOverLimit).toBe("boolean");
    });

    it("detects when input is within limit", () => {
      const result = processFiatInput("123.45", mockFiatUnit, "en-US");
      expect(result.clampedDisplay).toBe("123.45");
      expect(result.isOverLimit).toBe(false);
    });
  });

  describe("calculateFiatEquivalent", () => {
    const mockCalculate = (amount: BigNumber) => amount.multipliedBy(50000);

    it("uses direct calculation when available", () => {
      const result = calculateFiatEquivalent({
        amount: new BigNumber(1),
        lastTransactionAmount: new BigNumber(0.5),
        lastFiatAmount: new BigNumber(25000),
        calculateFiatFromCrypto: mockCalculate,
      });
      expect(result?.toString()).toBe("50000");
    });

    it("uses ratio calculation when direct is null", () => {
      const result = calculateFiatEquivalent({
        amount: new BigNumber(1),
        lastTransactionAmount: new BigNumber(0.5),
        lastFiatAmount: new BigNumber(25000),
        calculateFiatFromCrypto: () => null,
      });
      expect(result?.toString()).toBe("50000");
    });

    it("returns null when both methods fail", () => {
      const result = calculateFiatEquivalent({
        amount: new BigNumber(1),
        lastTransactionAmount: new BigNumber(0),
        lastFiatAmount: new BigNumber(0),
        calculateFiatFromCrypto: () => null,
      });
      expect(result).toBeNull();
    });
  });

  describe("shouldSyncInput", () => {
    it("syncs on quick action", () => {
      expect(
        shouldSyncInput({
          isQuickAction: true,
          useAllAmountChanged: false,
          isActiveInput: true,
          hasInputValue: true,
        }),
      ).toBe(true);
    });

    it("syncs when useAllAmount changed", () => {
      expect(
        shouldSyncInput({
          isQuickAction: false,
          useAllAmountChanged: true,
          isActiveInput: true,
          hasInputValue: true,
        }),
      ).toBe(true);
    });

    it("does not sync when actively typing", () => {
      expect(
        shouldSyncInput({
          isQuickAction: false,
          useAllAmountChanged: false,
          isActiveInput: true,
          hasInputValue: true,
        }),
      ).toBe(false);
    });

    it("syncs when not actively typing", () => {
      expect(
        shouldSyncInput({
          isQuickAction: false,
          useAllAmountChanged: false,
          isActiveInput: false,
          hasInputValue: false,
        }),
      ).toBe(true);
    });
  });
});
