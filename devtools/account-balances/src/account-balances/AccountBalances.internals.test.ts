import { ageSeconds, formatAmount, statusLine } from "./AccountBalances.internals";
import type { AccountBalanceRow } from "../types";

const ETH = { code: "ETH", magnitude: 18 };
const TRX = { code: "TRX", magnitude: 6 };

describe("formatAmount", () => {
  it("scales a smallest-unit value by the unit's magnitude", () => {
    expect(formatAmount("15336095429050782", ETH)).toBe("0.01533609 ETH");
    expect(formatAmount("1000000", TRX)).toBe("1 TRX");
  });

  it("keeps the whole part grouped and the fraction capped", () => {
    expect(formatAmount("123456789000000", TRX)).toBe("123,456,789 TRX");
    // 18 decimals would be unreadable in a table cell, so the fraction stops at 8.
    expect(formatAmount("1234567891234567891", ETH)).toBe("1.23456789 ETH");
  });

  it("keeps every digit of a whole part past Number.MAX_SAFE_INTEGER", () => {
    expect(formatAmount("123456789012345678901000000", TRX)).toBe(
      "123,456,789,012,345,678,901 TRX",
    );
  });

  it("distinguishes dust from nothing", () => {
    // 1 wei is not 0 ETH, and a tool built to make a balance trustworthy must not say it is.
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

  it("shows the raw value rather than a NaN when it cannot format", () => {
    // A devtool must never hide what the layer actually holds.
    expect(formatAmount("15336095429050782")).toBe("15336095429050782");
    expect(formatAmount("1.5", ETH)).toBe("1.5");
    expect(formatAmount("-1", ETH)).toBe("-1");
  });
});

describe("ageSeconds", () => {
  it("is undefined without a timestamp, and never negative", () => {
    expect(ageSeconds(undefined)).toBeUndefined();
    expect(ageSeconds("not-a-date")).toBeUndefined();
    expect(ageSeconds(new Date(Date.now() + 10_000).toISOString())).toBe(0);
  });
});

const row = (over: Partial<AccountBalanceRow> = {}): AccountBalanceRow => ({
  accountId: "js:2:tron:addr:",
  name: "Tron 1",
  currencyId: "tron",
  address: "addr",
  granular: true,
  tokens: [],
  status: { pending: false },
  ...over,
});

describe("statusLine", () => {
  it("prefers the error over anything else", () => {
    expect(statusLine(row({ status: { pending: false, error: "boom", sourceId: "x" } }))).toBe(
      "boom",
    );
  });

  it("says nothing was read when no source has answered", () => {
    expect(statusLine(row())).toBe("not read by the layer yet");
  });

  it("names the source, and its age once a balance carries one", () => {
    expect(statusLine(row({ status: { pending: false, sourceId: "granular" } }))).toBe(
      "served by granular",
    );
    const at = new Date(Date.now() - 5_000).toISOString();
    expect(
      statusLine(
        row({
          status: { pending: false, sourceId: "full-sync" },
          balance: { assetId: "tron", value: "1", spendable: "1", at },
        }),
      ),
    ).toBe("served by full-sync · observed 5s ago");
  });
});
