import { BigNumber } from "bignumber.js";
import { formatFeeRate } from "../gas";

describe("formatFeeRate", () => {
  it("formats valid BigNumber values to integer strings", () => {
    expect(formatFeeRate(new BigNumber(2.9))).toBe("2");
    expect(formatFeeRate(new BigNumber(5))).toBe("5");
    expect(formatFeeRate(new BigNumber(100.99))).toBe("100");
  });

  it("returns an empty string for invalid values", () => {
    expect(formatFeeRate(new BigNumber(NaN))).toBe("");
    expect(formatFeeRate(new BigNumber(Infinity))).toBe("");
    expect(formatFeeRate(new BigNumber(-Infinity))).toBe("");
    expect(formatFeeRate(undefined)).toBe("");
  });

  it("handles zero", () => {
    expect(formatFeeRate(new BigNumber(0))).toBe("0");
  });
});
