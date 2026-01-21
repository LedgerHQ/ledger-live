import { BigNumber } from "bignumber.js";
import { getMinFees } from "../../../editTransaction/getMinEditTransactionFees";

describe("getMinFees", () => {
  it("returns at least +1 sat/vB bump for very small fees", () => {
    const feePerByte = new BigNumber(1);
    const { feePerByte: bumped } = getMinFees({ feePerByte });

    expect(bumped.isEqualTo(new BigNumber(2))).toBe(true);
  });

  it("returns at least +10% bump for larger fees", () => {
    const feePerByte = new BigNumber(100);
    const { feePerByte: bumped } = getMinFees({ feePerByte });

    expect(bumped.isEqualTo(new BigNumber(110))).toBe(true);
  });

  it("returns the same result when +10% and +1 sat/vB are equal", () => {
    const feePerByte = new BigNumber(10);
    const { feePerByte: bumped } = getMinFees({ feePerByte });

    expect(bumped.isEqualTo(new BigNumber(11))).toBe(true);
  });

  it("rounds up to the next integer when the bump is fractional", () => {
    const feePerByte = new BigNumber(15);
    const { feePerByte: bumped } = getMinFees({ feePerByte });

    expect(bumped.isEqualTo(new BigNumber(17))).toBe(true);
    expect(bumped.isInteger()).toBe(true);
  });

  it("handles zero fee by returning 1 sat/vB", () => {
    const feePerByte = new BigNumber(0);
    const { feePerByte: bumped } = getMinFees({ feePerByte });

    expect(bumped.isEqualTo(new BigNumber(1))).toBe(true);
  });

  it("works with non-integer input fees", () => {
    const feePerByte = new BigNumber("1.5");
    const { feePerByte: bumped } = getMinFees({ feePerByte });

    expect(bumped.isEqualTo(new BigNumber(3))).toBe(true);
  });
});
