import { formatTrendPercent, getTrendSign, getTrendTone } from "./trend";

describe("getTrendTone", () => {
  it.each([
    [null, "neutral"],
    [undefined, "neutral"],
    [Number.NaN, "neutral"],
    [0, "neutral"],
    [-0, "neutral"],
    [0.004, "positive"],
    [3.5, "positive"],
    [-0.004, "negative"],
    [-1.2, "negative"],
  ] as const)("returns the tone of %p", (value, expected) => {
    expect(getTrendTone(value)).toBe(expected);
  });

  it("compares the rounded value when decimals is set", () => {
    expect(getTrendTone(0.004, { decimals: 2 })).toBe("neutral");
    expect(getTrendTone(-0.004, { decimals: 2 })).toBe("neutral");
    expect(getTrendTone(0.005, { decimals: 2 })).toBe("positive");
    expect(getTrendTone(-0.006, { decimals: 2 })).toBe("negative");
  });
});

describe("getTrendSign", () => {
  it.each([
    [3.5, "+"],
    [-1.2, "-"],
    [0, ""],
    [-0, ""],
  ] as const)("returns the sign of %p", (value, expected) => {
    expect(getTrendSign(value)).toBe(expected);
  });

  it("uses zeroSign for zero", () => {
    expect(getTrendSign(0, { zeroSign: "+" })).toBe("+");
  });

  it("compares the rounded value when decimals is set", () => {
    expect(getTrendSign(0.004, { decimals: 2 })).toBe("");
    expect(getTrendSign(0.004, { decimals: 2, zeroSign: "+" })).toBe("+");
    expect(getTrendSign(-0.006, { decimals: 2 })).toBe("-");
  });
});

describe("formatTrendPercent", () => {
  it.each([
    [3.5, "+3.50%"],
    [-1.2, "-1.20%"],
    [0, "0.00%"],
    [-0, "0.00%"],
    [0.004, "+0.00%"],
    [-0.004, "-0.00%"],
    [12.3456789, "+12.35%"],
  ] as const)("formats %p with two decimals by default", (value, expected) => {
    expect(formatTrendPercent(value)).toBe(expected);
  });

  it("matches toFixed for negative values", () => {
    [-0.004, -1.2, -3.456].forEach(value => {
      expect(formatTrendPercent(value)).toBe(`${value.toFixed(2)}%`);
    });
  });

  it("prefixes zero with zeroSign", () => {
    expect(formatTrendPercent(0, { zeroSign: "+" })).toBe("+0.00%");
    expect(formatTrendPercent(-0, { zeroSign: "+" })).toBe("+0.00%");
  });

  it("keeps the raw digits when decimals is null", () => {
    expect(formatTrendPercent(0.5, { decimals: null })).toBe("+0.5%");
    expect(formatTrendPercent(-100, { decimals: null })).toBe("-100%");
    expect(formatTrendPercent(0, { decimals: null })).toBe("0%");
  });

  it("rounds to the requested decimals", () => {
    expect(formatTrendPercent(3.5, { decimals: 0 })).toBe("+4%");
    expect(formatTrendPercent(-1.2, { decimals: 1 })).toBe("-1.2%");
  });
});
