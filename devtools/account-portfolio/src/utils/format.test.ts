import { formatAmount, formatCurrencyValue, shorten } from "./format";

describe("formatAmount", () => {
  it.each([
    ["1000000000000000000", 18, "1"],
    ["1500000", 6, "1.5"],
    ["-1000", 18, "-0.000000000000001"],
    ["5", 0, "5"],
    ["123", 2, "1.23"],
  ])("formats %s with %s decimals as %s", (amount, decimals, expected) => {
    expect(formatAmount(amount, decimals)).toBe(expected);
  });

  it("leaves the amount as is when the decimals are unknown or it is not an integer", () => {
    expect(formatAmount("42", undefined)).toBe("42");
    expect(formatAmount("1.5", 6)).toBe("1.5");
  });
});

describe("formatCurrencyValue", () => {
  it("rounds to two decimals and upper-cases the currency", () => {
    expect(formatCurrencyValue(2.5, "usd")).toBe("2.50 USD");
  });

  it("groups the thousands", () => {
    expect(formatCurrencyValue(1234567.891, "eur")).toBe("1,234,567.89 EUR");
  });

  it("is undefined without a value", () => {
    expect(formatCurrencyValue(undefined, "usd")).toBeUndefined();
  });
});

describe("shorten", () => {
  it("keeps short values and shortens long ones", () => {
    expect(shorten("0xabc")).toBe("0xabc");
    expect(shorten("0x1234567890abcdef1234567890abcdef")).toBe("0x1234…abcdef");
  });
});
