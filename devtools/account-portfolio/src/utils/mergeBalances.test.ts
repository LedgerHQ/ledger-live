import type { PortfolioBalanceView } from "../types";
import { balanceTotals, mergeBalances } from "./mergeBalances";

const entry = (
  asset: string,
  status: "confirmed" | "pending",
  amount: string,
  currencyValue?: number,
  accountId = "a",
): PortfolioBalanceView => ({
  network: "base",
  asset,
  amount,
  currencyValue,
  accountId,
  status,
  estimated: false,
  locked: false,
});

describe("mergeBalances", () => {
  it("gives one row for an asset answered as confirmed and pending with the same amount", () => {
    const rows = mergeBalances([entry("eth", "confirmed", "5"), entry("eth", "pending", "5")]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pendingOnly: false, pending: undefined });
    expect(rows[0].entry.status).toBe("confirmed");
  });

  it("keeps the pending side when it differs from the confirmed one", () => {
    const [row] = mergeBalances([entry("eth", "confirmed", "5"), entry("eth", "pending", "7")]);
    expect(row.pending?.amount).toBe("7");
    expect(row.entry.amount).toBe("5");
  });

  it("shows a pending-only asset as pending", () => {
    const [row] = mergeBalances([entry("eth", "pending", "3")]);
    expect(row).toMatchObject({ pendingOnly: true });
    expect(row.entry.status).toBe("pending");
  });

  it("keeps a locked holding apart from the unlocked one of the same asset", () => {
    const rows = mergeBalances([
      entry("eth", "confirmed", "10", 10),
      { ...entry("eth", "confirmed", "20", 20), locked: true },
    ]);
    expect(rows.map(row => [row.entry.amount, row.entry.locked])).toEqual([
      ["10", false],
      ["20", true],
    ]);
    expect(balanceTotals(rows).fiat).toBe(30);
  });

  it("keeps assets and accounts apart, in the order they first appeared", () => {
    const rows = mergeBalances([
      entry("btc", "confirmed", "1", 9, "a"),
      entry("eth", "confirmed", "2", 5, "a"),
      entry("btc", "pending", "1", 9, "a"),
      entry("btc", "confirmed", "4", 3, "b"),
    ]);
    expect(rows.map(r => `${r.entry.accountId}:${r.entry.asset}`)).toEqual([
      "a:btc",
      "a:eth",
      "b:btc",
    ]);
  });
});

describe("balanceTotals", () => {
  it("adds up the value of the rows, counts assets and accounts, and flags what has no value", () => {
    const rows = mergeBalances([
      entry("btc", "confirmed", "1", 100.5, "a"),
      entry("btc", "pending", "1", 100.5, "a"),
      entry("eth", "confirmed", "2", 20, "b"),
      entry("dust", "confirmed", "9", undefined, "b"),
    ]);
    expect(balanceTotals(rows)).toEqual({ fiat: 120.5, assets: 3, accounts: 2, unvalued: 1 });
  });

  it("is empty for no rows", () => {
    expect(balanceTotals([])).toEqual({ fiat: 0, assets: 0, accounts: 0, unvalued: 0 });
  });
});
