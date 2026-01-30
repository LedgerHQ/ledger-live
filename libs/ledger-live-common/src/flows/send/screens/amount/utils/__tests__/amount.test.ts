import { BigNumber } from "bignumber.js";
import { areAmountsEqual } from "../amount";

describe("amount", () => {
  describe("areAmountsEqual", () => {
    const tolerance = new BigNumber(0.01);

    it("should return true for equal amounts", () => {
      expect(areAmountsEqual(new BigNumber(100), new BigNumber(100), tolerance)).toBe(true);
    });

    it("should return true for amounts within tolerance", () => {
      expect(areAmountsEqual(new BigNumber(100), new BigNumber(100.005), tolerance)).toBe(true);
      expect(areAmountsEqual(new BigNumber(100.005), new BigNumber(100), tolerance)).toBe(true);
    });

    it("should return false for amounts outside tolerance", () => {
      expect(areAmountsEqual(new BigNumber(100), new BigNumber(100.02), tolerance)).toBe(false);
      expect(areAmountsEqual(new BigNumber(100.02), new BigNumber(100), tolerance)).toBe(false);
    });
  });
});
