import { formatAmount, formatTrend, formatValue, statusLine } from "./AccountData.internals";

const ETH = { code: "ETH", magnitude: 18 };

describe("formatAmount", () => {
  it("renders a smallest-unit amount with its unit", () => {
    expect(formatAmount("1500000000000000000", ETH)).toBe("1.5 ETH");
    expect(formatAmount("1234567000000000000000", ETH)).toBe("1,234.567 ETH");
  });

  it("shows dust as dust, and the raw value without a unit", () => {
    expect(formatAmount("1", ETH)).toBe("<0.00000001 ETH");
    expect(formatAmount("42")).toBe("42");
  });
});

describe("formatValue and formatTrend", () => {
  it("render a fiat value and a signed percentage, or a dash", () => {
    expect(formatValue(123456, { code: "USD", magnitude: 2 })).toBe("1,234.56 USD");
    expect(formatValue(undefined, { code: "USD", magnitude: 2 })).toBe("—");
    expect(formatTrend(0.0787)).toBe("+7.87%");
    expect(formatTrend(-0.0012)).toBe("-0.12%");
    expect(formatTrend(undefined)).toBe("—");
  });
});

describe("statusLine", () => {
  it("prefers the error, then the read in flight, then who answered and when", () => {
    expect(statusLine({ pending: true, error: "down" })).toBe("down");
    expect(statusLine({ pending: true })).toBe("reading…");
    expect(statusLine({ pending: false })).toBe("not read yet");
    expect(statusLine({ pending: false, sourceId: "full-sync", readAt: 1000 }, 6000)).toBe(
      "served by full-sync · 5s ago",
    );
  });
});
