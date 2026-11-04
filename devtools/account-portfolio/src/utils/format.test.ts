import { formatAmount, formatCurrencyValue, shorten } from "./format";

describe("formatAmount", () => {
  it("formats an integer amount and leaves the rest as sent", () => {
    expect(formatAmount("1500000", 6)).toBe("1.5");
    expect(formatAmount("42", undefined)).toBe("42");
    expect(formatAmount("1.5", 6)).toBe("1.5");
  });
});

describe("formatCurrencyValue", () => {
  it("rounds to two decimals, and is absent without a value", () => {
    expect(formatCurrencyValue(2.5, "usd")).toBe("2.50 USD");
    expect(formatCurrencyValue(undefined, "usd")).toBeUndefined();
  });
});

describe("shorten", () => {
  it("shortens a long value", () => {
    expect(shorten("0x1234567890abcdef1234567890abcdef")).toBe("0x1234…abcdef");
  });
});
