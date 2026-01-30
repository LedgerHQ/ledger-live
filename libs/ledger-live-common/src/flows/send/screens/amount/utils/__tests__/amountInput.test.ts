import { BigNumber } from "bignumber.js";
import {
  formatAmountForInput,
  formatFiatForInput,
  processRawInput,
  processFiatInput,
  shouldSyncInput,
} from "../amountInput";

const mockUnit = {
  magnitude: 8,
  code: "BTC",
  name: "Bitcoin",
};

const mockFiatUnit = {
  magnitude: 2,
  code: "USD",
  name: "US Dollar",
};

describe("amountInput", () => {
  describe("formatAmountForInput", () => {
    it("should return empty string for zero amount", () => {
      expect(formatAmountForInput(mockUnit, new BigNumber(0), "en-US")).toBe("");
    });

    it("should format non-zero amounts", () => {
      const result = formatAmountForInput(mockUnit, new BigNumber(1.5), "en-US");
      expect(result).toBeTruthy();
      expect(result).not.toBe("");
    });
  });

  describe("formatFiatForInput", () => {
    it("should return empty string for zero amount", () => {
      expect(formatFiatForInput(mockFiatUnit, new BigNumber(0), "en-US")).toBe("");
    });

    it("should format and trim trailing zeros", () => {
      const result = formatFiatForInput(mockFiatUnit, new BigNumber(100), "en-US");
      expect(result).toBeTruthy();
    });
  });

  describe("processRawInput", () => {
    it("should process valid input", () => {
      const result = processRawInput("1.5", mockUnit, "en-US");
      expect(result.value.isFinite()).toBe(true);
      expect(result.display).toBeTruthy();
    });

    it("should handle empty input", () => {
      const result = processRawInput("", mockUnit, "en-US");
      expect(result.value.isZero()).toBe(true);
    });
  });

  describe("processFiatInput", () => {
    it("should clamp decimal places", () => {
      const result = processFiatInput("10.999", mockFiatUnit, "en-US");
      expect(result.isOverLimit).toBe(true);
    });

    it("should not flag valid decimal places", () => {
      const result = processFiatInput("10.99", mockFiatUnit, "en-US");
      expect(result.isOverLimit).toBe(false);
    });
  });

  describe("shouldSyncInput", () => {
    it("should sync on quick action", () => {
      expect(
        shouldSyncInput({
          isQuickAction: true,
          useAllAmountChanged: false,
          isActiveInput: true,
          hasInputValue: true,
        }),
      ).toBe(true);
    });

    it("should sync on useAllAmount change", () => {
      expect(
        shouldSyncInput({
          isQuickAction: false,
          useAllAmountChanged: true,
          isActiveInput: true,
          hasInputValue: true,
        }),
      ).toBe(true);
    });

    it("should not sync active input with value", () => {
      expect(
        shouldSyncInput({
          isQuickAction: false,
          useAllAmountChanged: false,
          isActiveInput: true,
          hasInputValue: true,
        }),
      ).toBe(false);
    });

    it("should sync inactive input", () => {
      expect(
        shouldSyncInput({
          isQuickAction: false,
          useAllAmountChanged: false,
          isActiveInput: false,
          hasInputValue: true,
        }),
      ).toBe(true);
    });
  });
});
