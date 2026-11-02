import type { PortfolioBalanceView } from "../types";
import { balanceTotals, mergeBalances } from "./mergeBalances";

const entry = (
  asset: string,
  status: "confirmed" | "pending",
  amount: string,
  currencyValue?: number,
): PortfolioBalanceView => ({
  network: "base",
  asset,
  amount,
  currencyValue,
  accountId: "a",
  status,
  estimated: false,
  locked: false,
});

describe("mergeBalances", () => {
  it("keeps one row when confirmed and pending hold the same amount", () => {
    const rows = mergeBalances([entry("eth", "confirmed", "5"), entry("eth", "pending", "5")]);
    expect(rows).toHaveLength(1);
    expect(rows[0].pending).toBeUndefined();
  });

  it("keeps the pending side when it differs, and a locked holding apart", () => {
    const rows = mergeBalances([
      entry("eth", "confirmed", "5", 10),
      entry("eth", "pending", "7", 10),
      { ...entry("eth", "confirmed", "20", 20), locked: true },
    ]);
    expect(rows.map(row => [row.entry.amount, row.entry.locked, row.pending?.amount])).toEqual([
      ["5", false, "7"],
      ["20", true, undefined],
    ]);
    expect(balanceTotals(rows).fiat).toBe(30);
  });
});
