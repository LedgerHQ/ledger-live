import type { AccountPortfolioView, PortfolioBalanceView } from "../types";
import { sortByFiat } from "./sortByFiat";

const entry = (asset: string, currencyValue?: number): PortfolioBalanceView => ({
  network: "base",
  asset,
  amount: "1",
  currencyValue,
  accountId: "a",
  status: "confirmed",
  estimated: false,
  locked: false,
});

describe("sortByFiat", () => {
  it("orders by value and leaves the entries without one last", () => {
    const view: AccountPortfolioView = {
      kind: "balance",
      hasMore: false,
      failures: [],
      entries: [entry("x"), entry("a", 1), entry("b", 250)],
    };
    const sorted = sortByFiat(view);
    expect(sorted.kind === "balance" && sorted.entries.map(row => row.asset)).toEqual([
      "b",
      "a",
      "x",
    ]);
  });
});
