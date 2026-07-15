import { getAdjustedGasLimit } from "./gasLimitAdjusted";

const DEFAULT_GAS_LIMIT = "3000000";

describe("getAdjustedGasLimit", () => {
  it("should apply the given multiplier with ceiling rounding", () => {
    expect(getAdjustedGasLimit("21000", 1.5, DEFAULT_GAS_LIMIT)).toBe("31500");
  });

  it("should fall back to defaultGasLimit when missing", () => {
    expect(getAdjustedGasLimit(undefined, 1.5, DEFAULT_GAS_LIMIT)).toBe(DEFAULT_GAS_LIMIT);
  });

  it("should fall back to defaultGasLimit when null", () => {
    expect(getAdjustedGasLimit(null, 1.5, DEFAULT_GAS_LIMIT)).toBe(DEFAULT_GAS_LIMIT);
  });

  it("should fall back to defaultGasLimit when zero", () => {
    expect(getAdjustedGasLimit(0, 1.5, DEFAULT_GAS_LIMIT)).toBe(DEFAULT_GAS_LIMIT);
  });

  it("should fall back to defaultGasLimit when invalid", () => {
    expect(getAdjustedGasLimit("not-a-number", 1.5, DEFAULT_GAS_LIMIT)).toBe(DEFAULT_GAS_LIMIT);
  });

  it("should ceil decimals after applying multiplier", () => {
    expect(getAdjustedGasLimit("21000.2", 1.5, DEFAULT_GAS_LIMIT)).toBe("31501");
  });

  it("should work with a different multiplier", () => {
    expect(getAdjustedGasLimit("21000", 1.3, DEFAULT_GAS_LIMIT)).toBe("27300");
  });

  it("should work with approval gas multiplier", () => {
    expect(getAdjustedGasLimit("21000", 1.2, DEFAULT_GAS_LIMIT)).toBe("25200");
  });

  it("should use the provided default gas limit value", () => {
    expect(getAdjustedGasLimit(undefined, 1.5, "5000000")).toBe("5000000");
  });

  it("should fall back to multiplier of 1 when NaN", () => {
    expect(getAdjustedGasLimit("21000", NaN, DEFAULT_GAS_LIMIT)).toBe("21000");
  });

  it("should fall back to multiplier of 1 when Infinity", () => {
    expect(getAdjustedGasLimit("21000", Infinity, DEFAULT_GAS_LIMIT)).toBe("21000");
  });

  it("should fall back to multiplier of 1 when zero", () => {
    expect(getAdjustedGasLimit("21000", 0, DEFAULT_GAS_LIMIT)).toBe("21000");
  });

  it("should fall back to multiplier of 1 when negative", () => {
    expect(getAdjustedGasLimit("21000", -2, DEFAULT_GAS_LIMIT)).toBe("21000");
  });
});
