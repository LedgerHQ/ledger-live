import { BigNumber } from "bignumber.js";
import { formatFeeRate, getGasOptionValue, hasDistinctGasOptions, isGasOptionRecord } from "../gas";

describe("isGasOptionRecord", () => {
  it("returns true for valid objects", () => {
    expect(isGasOptionRecord({})).toBe(true);
    expect(isGasOptionRecord({ maxFeePerGas: 100 })).toBe(true);
    expect(isGasOptionRecord({ gasPrice: 50 })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isGasOptionRecord(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isGasOptionRecord(undefined)).toBe(false);
    expect(isGasOptionRecord(123)).toBe(false);
    expect(isGasOptionRecord("string")).toBe(false);
    expect(isGasOptionRecord(true)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isGasOptionRecord([])).toBe(false);
    expect(isGasOptionRecord([1, 2, 3])).toBe(false);
  });
});

describe("getGasOptionValue", () => {
  it("returns maxFeePerGas when present", () => {
    const maxFeePerGas = new BigNumber(100);
    const option = { maxFeePerGas };

    expect(getGasOptionValue(option)).toEqual(maxFeePerGas);
  });

  it("returns gasPrice when maxFeePerGas is not present", () => {
    const gasPrice = new BigNumber(50);
    const option = { gasPrice };

    expect(getGasOptionValue(option)).toEqual(gasPrice);
  });

  it("prefers maxFeePerGas over gasPrice", () => {
    const maxFeePerGas = new BigNumber(100);
    const gasPrice = new BigNumber(50);
    const option = { maxFeePerGas, gasPrice };

    expect(getGasOptionValue(option)).toEqual(maxFeePerGas);
  });

  it("returns null for invalid option", () => {
    expect(getGasOptionValue(null)).toBeNull();
    expect(getGasOptionValue(undefined)).toBeNull();
    expect(getGasOptionValue("invalid")).toBeNull();
  });

  it("returns null when neither maxFeePerGas nor gasPrice is BigNumber", () => {
    const option = { maxFeePerGas: "100", gasPrice: "50" };
    expect(getGasOptionValue(option)).toBeNull();
  });
});

describe("hasDistinctGasOptions", () => {
  it("returns false for invalid input", () => {
    expect(hasDistinctGasOptions(null)).toBe(false);
    expect(hasDistinctGasOptions(undefined)).toBe(false);
    expect(hasDistinctGasOptions("invalid")).toBe(false);
  });

  it("returns false when less than 2 valid options", () => {
    const gasOptions = {
      slow: { maxFeePerGas: new BigNumber(10) },
    };
    expect(hasDistinctGasOptions(gasOptions)).toBe(false);
  });

  it("returns false when all options have same value", () => {
    const value = new BigNumber(10);
    const gasOptions = {
      slow: { maxFeePerGas: value },
      medium: { maxFeePerGas: value },
      fast: { maxFeePerGas: value },
    };
    expect(hasDistinctGasOptions(gasOptions)).toBe(false);
  });

  it("returns true when options have different values", () => {
    const gasOptions = {
      slow: { maxFeePerGas: new BigNumber(10) },
      medium: { maxFeePerGas: new BigNumber(20) },
      fast: { maxFeePerGas: new BigNumber(30) },
    };
    expect(hasDistinctGasOptions(gasOptions)).toBe(true);
  });

  it("handles mix of maxFeePerGas and gasPrice", () => {
    const gasOptions = {
      slow: { gasPrice: new BigNumber(10) },
      medium: { maxFeePerGas: new BigNumber(20) },
      fast: { gasPrice: new BigNumber(30) },
    };
    expect(hasDistinctGasOptions(gasOptions)).toBe(true);
  });

  it("ignores invalid options", () => {
    const gasOptions = {
      slow: { maxFeePerGas: new BigNumber(10) },
      medium: { maxFeePerGas: new BigNumber(20) },
      fast: { invalid: "value" },
    };
    expect(hasDistinctGasOptions(gasOptions)).toBe(true);
  });
});

describe("formatFeeRate", () => {
  it("formats valid BigNumber to integer string", () => {
    expect(formatFeeRate(new BigNumber(2.9))).toBe("2");
    expect(formatFeeRate(new BigNumber(5))).toBe("5");
    expect(formatFeeRate(new BigNumber(100.99))).toBe("100");
  });

  it("returns empty string for NaN", () => {
    expect(formatFeeRate(new BigNumber(NaN))).toBe("");
  });

  it("returns empty string for Infinity", () => {
    expect(formatFeeRate(new BigNumber(Infinity))).toBe("");
    expect(formatFeeRate(new BigNumber(-Infinity))).toBe("");
  });

  it("returns empty string for undefined", () => {
    // @ts-expect-error - Testing runtime behavior with undefined, function handles it with optional chaining
    expect(formatFeeRate(undefined)).toBe("");
  });

  it("handles zero", () => {
    expect(formatFeeRate(new BigNumber(0))).toBe("0");
  });

  it("rounds down to integer", () => {
    expect(formatFeeRate(new BigNumber(2.9))).toBe("2");
    expect(formatFeeRate(new BigNumber(2.1))).toBe("2");
  });
});
