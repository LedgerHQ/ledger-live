import { BigNumber } from "bignumber.js";
import { areAmountsEqual } from "../amount";

describe("areAmountsEqual", () => {
  it("returns true when amounts are equal within tolerance", () => {
    const a = new BigNumber(100);
    const b = new BigNumber(100);
    const tolerance = new BigNumber(0.01);

    expect(areAmountsEqual(a, b, tolerance)).toBe(true);
  });

  it("returns true when amounts differ by less than tolerance", () => {
    const a = new BigNumber(100);
    const b = new BigNumber(100.005);
    const tolerance = new BigNumber(0.01);

    expect(areAmountsEqual(a, b, tolerance)).toBe(true);
  });

  it("returns false when amounts differ by more than tolerance", () => {
    const a = new BigNumber(100);
    const b = new BigNumber(100.02);
    const tolerance = new BigNumber(0.01);

    expect(areAmountsEqual(a, b, tolerance)).toBe(false);
  });

  it("handles zero tolerance correctly", () => {
    const a = new BigNumber(100);
    const b = new BigNumber(100);
    const tolerance = new BigNumber(0);

    expect(areAmountsEqual(a, b, tolerance)).toBe(true);
  });

  it("handles negative differences correctly", () => {
    const a = new BigNumber(100);
    const b = new BigNumber(99.995);
    const tolerance = new BigNumber(0.01);

    expect(areAmountsEqual(a, b, tolerance)).toBe(true);
  });
});
