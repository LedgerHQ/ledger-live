import { ageSeconds, statusLine } from "./AccountBalances.internals";
import type { AccountBalanceRow } from "../types";

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
