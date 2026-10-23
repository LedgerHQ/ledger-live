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

const balance = (...entries: PortfolioBalanceView[]): AccountPortfolioView => ({
  kind: "balance",
  hasMore: false,
  failures: [],
  entries,
});

const assets = (view: AccountPortfolioView) =>
  view.kind === "balance" ? view.entries.map(e => e.asset) : [];

describe("sortByFiat", () => {
  it("orders the entries from the most valuable to the least", () => {
    expect(assets(sortByFiat(balance(entry("a", 1), entry("b", 250.5), entry("c", 30))))).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("puts the entries without a value last, in the order they came", () => {
    expect(
      assets(sortByFiat(balance(entry("x"), entry("a", 0), entry("y"), entry("b", 5)))),
    ).toEqual(["b", "a", "x", "y"]);
  });

  it("keeps the order of entries worth the same", () => {
    expect(assets(sortByFiat(balance(entry("a", 2), entry("b", 2), entry("c", 2))))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("does not touch the view it is given", () => {
    const view = balance(entry("a", 1), entry("b", 2));
    sortByFiat(view);
    expect(assets(view)).toEqual(["a", "b"]);
  });

  it("leaves operations in their chronological order", () => {
    const view: AccountPortfolioView = { kind: "updates", hasMore: false, operations: [] };
    expect(sortByFiat(view)).toBe(view);
  });
});
