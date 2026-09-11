import { describe, expect, it } from "@jest/globals";
import { formatAmount } from "./formatAmount";

const ETH = { code: "ETH", magnitude: 18 };
const TRX = { code: "TRX", magnitude: 6 };

describe("formatAmount", () => {
  it("scales a smallest-unit value by the unit's magnitude", () => {
    expect(formatAmount("15336095429050782", ETH)).toBe("0.01533609 ETH");
    expect(formatAmount("1000000", TRX)).toBe("1 TRX");
  });

  it("keeps the whole part grouped and the fraction capped", () => {
    expect(formatAmount("123456789000000", TRX)).toBe("123,456,789 TRX");
    expect(formatAmount("1234567891234567891", ETH)).toBe("1.23456789 ETH");
  });

  it("keeps every digit of a whole part past Number.MAX_SAFE_INTEGER", () => {
    expect(formatAmount("123456789012345678901000000", TRX)).toBe(
      "123,456,789,012,345,678,901 TRX",
    );
  });

  it("distinguishes dust from nothing", () => {
    expect(formatAmount("1", ETH)).toBe("<0.00000001 ETH");
    expect(formatAmount("9999999999", ETH)).toBe("<0.00000001 ETH");
    expect(formatAmount("0", TRX)).toBe("0 TRX");
    expect(formatAmount("0", ETH)).toBe("0 ETH");
  });

  it("does not floor an amount that has a visible digit", () => {
    expect(formatAmount("10000000000", ETH)).toBe("0.00000001 ETH");
  });

  it("supports a magnitude of zero", () => {
    expect(formatAmount("42", { code: "SAT", magnitude: 0 })).toBe("42 SAT");
  });

  it("shows the raw value rather than trust a magnitude a caller made up", () => {
    // The unit crosses a package boundary, so a negative, fractional or absurd magnitude is a
    // reachable input — and `padStart` on one of those is either wrong or a memory spike.
    expect(formatAmount("1000", { code: "X", magnitude: -1 })).toBe("1000");
    expect(formatAmount("1000", { code: "X", magnitude: 1.5 })).toBe("1000");
    expect(formatAmount("1000", { code: "X", magnitude: 1e9 })).toBe("1000");
    expect(formatAmount("1000", { code: "X", magnitude: Number.NaN })).toBe("1000");
  });

  it("shows the raw value rather than a NaN when it cannot format", () => {
    expect(formatAmount("15336095429050782")).toBe("15336095429050782");
    expect(formatAmount("1.5", ETH)).toBe("1.5");
    expect(formatAmount("-1", ETH)).toBe("-1");
  });
});
