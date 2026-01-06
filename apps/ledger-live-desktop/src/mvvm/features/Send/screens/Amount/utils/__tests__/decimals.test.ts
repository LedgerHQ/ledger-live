import { clampDecimals, isOverDecimalLimit, trimTrailingZeros } from "../decimals";

describe("clampDecimals", () => {
  it("returns string unchanged when decimals are 2 or less", () => {
    expect(clampDecimals("123.45")).toBe("123.45");
    expect(clampDecimals("123.4")).toBe("123.4");
    expect(clampDecimals("123")).toBe("123");
  });

  it("clamps decimals to 2 when more than 2", () => {
    expect(clampDecimals("123.456")).toBe("123.45");
    expect(clampDecimals("123.456789")).toBe("123.45");
  });

  it("handles comma as decimal separator", () => {
    expect(clampDecimals("123,456")).toBe("123,45");
    expect(clampDecimals("123,4")).toBe("123,4");
  });

  it("handles multiple separators by using the last one", () => {
    expect(clampDecimals("1.234.567")).toBe("1.234.56");
    expect(clampDecimals("1,234,567")).toBe("1,234,56");
  });

  it("preserves the separator character", () => {
    expect(clampDecimals("123.456")).toBe("123.45");
    expect(clampDecimals("123,456")).toBe("123,45");
  });
});

describe("isOverDecimalLimit", () => {
  it("returns false when no decimal separator", () => {
    expect(isOverDecimalLimit("123")).toBe(false);
    expect(isOverDecimalLimit("")).toBe(false);
  });

  it("returns false when decimals are 2 or less", () => {
    expect(isOverDecimalLimit("123.45")).toBe(false);
    expect(isOverDecimalLimit("123.4")).toBe(false);
    expect(isOverDecimalLimit("123.1")).toBe(false);
  });

  it("returns true when decimals exceed 2", () => {
    expect(isOverDecimalLimit("123.456")).toBe(true);
    expect(isOverDecimalLimit("123.456789")).toBe(true);
  });

  it("handles comma as decimal separator", () => {
    expect(isOverDecimalLimit("123,456")).toBe(true);
    expect(isOverDecimalLimit("123,45")).toBe(false);
  });

  it("uses the last separator when multiple exist", () => {
    expect(isOverDecimalLimit("1.234.567")).toBe(true);
    expect(isOverDecimalLimit("1,234,567")).toBe(true);
  });
});

describe("trimTrailingZeros", () => {
  it("returns string unchanged when no decimal separator", () => {
    expect(trimTrailingZeros("123")).toBe("123");
    expect(trimTrailingZeros("0")).toBe("0");
  });

  it("removes trailing zeros", () => {
    expect(trimTrailingZeros("123.450")).toBe("123.45");
    expect(trimTrailingZeros("123.400")).toBe("123.4");
    expect(trimTrailingZeros("123.000")).toBe("123");
  });

  it("preserves non-zero decimals", () => {
    expect(trimTrailingZeros("123.456")).toBe("123.456");
    expect(trimTrailingZeros("123.4506")).toBe("123.4506");
  });

  it("handles comma as decimal separator", () => {
    expect(trimTrailingZeros("123,450")).toBe("123,45");
    expect(trimTrailingZeros("123,000")).toBe("123");
  });

  it("removes all decimals when only zeros", () => {
    expect(trimTrailingZeros("123.00")).toBe("123");
    expect(trimTrailingZeros("123,000")).toBe("123");
  });

  it("handles edge case with single zero", () => {
    expect(trimTrailingZeros("123.0")).toBe("123");
    expect(trimTrailingZeros("0.0")).toBe("0");
  });
});
