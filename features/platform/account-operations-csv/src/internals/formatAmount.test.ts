import { formatAmount } from "./formatAmount";

const BTC = { name: "bitcoin", code: "BTC", magnitude: 8 };
const USD = { name: "US Dollar", code: "USD", magnitude: 2, showAllDigits: true };

describe("formatAmount", () => {
  it("writes every digit of the smallest unit as a plain decimal, without trailing zeros", () => {
    expect(formatAmount("123456789", BTC)).toBe("1.23456789");
    expect(formatAmount("150000000", BTC)).toBe("1.5");
    expect(formatAmount("1", BTC)).toBe("0.00000001");
    expect(formatAmount("0", BTC)).toBe("0");
  });

  it("does not group the thousands", () => {
    expect(formatAmount("123456700000000", BTC)).toBe("1234567");
  });

  it("keeps every digit of a unit that shows them all", () => {
    expect(formatAmount("1200", USD)).toBe("12.00");
  });

  it("rounds a fractional smallest unit half up to the unit's digits", () => {
    expect(formatAmount(1234.5, USD)).toBe("12.35");
  });
});
