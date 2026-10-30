import type { AccountPortfolioView, PortfolioBalanceView } from "../types";
import { filterByText, isSearchable } from "./filterByText";

const balance = (ticker: string, network = "base"): PortfolioBalanceView => ({
  network,
  asset: ticker,
  ticker,
  name: `${ticker} token`,
  amount: "1",
  accountId: "base:0x1",
  status: "confirmed",
  estimated: false,
  locked: false,
});
const view = (...entries: PortfolioBalanceView[]): AccountPortfolioView => ({
  kind: "balance",
  hasMore: false,
  failures: [],
  entries,
});
const tickers = (v: AccountPortfolioView) =>
  v.kind === "balance" ? v.entries.map(e => e.ticker) : [];

describe("filterByText", () => {
  const entries = [balance("ETH", "ethereum"), balance("USDC"), balance("DAI")];

  it("keeps the lines where every word matches, whatever the case", () => {
    expect(tickers(filterByText(view(...entries), "ethereum eth").view)).toEqual(["ETH"]);
    expect(tickers(filterByText(view(...entries), "ethereum dai").view)).toEqual([]);
  });

  it("leaves a result with nothing to search", () => {
    const portfolio: AccountPortfolioView = {
      kind: "portfolio",
      id: "p",
      registrations: 0,
      registrationEntries: [],
      accounts: [],
    };
    expect(filterByText(portfolio, "zzz")).toEqual({ view: portfolio, hidden: 0 });
    expect(isSearchable(portfolio)).toBe(false);
  });
});
