import type { AccountPortfolioView, PortfolioAssetView, PortfolioBalanceView } from "../types";
import { filterByText, isSearchable } from "./filterByText";

const balance = (
  asset: string,
  ticker: string,
  network = "base",
  accountId = "base:0x1",
): PortfolioBalanceView => ({
  network,
  asset,
  ticker,
  name: `${ticker} token`,
  amount: "1",
  accountId,
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
  const entries = [
    balance("native", "ETH", "ethereum"),
    balance("erc20.0x1", "USDC"),
    balance("erc20.0x2", "DAI"),
  ];

  it("leaves the view as it is for an empty search", () => {
    const v = view(...entries);
    expect(filterByText(v, "  ")).toEqual({ view: v, hidden: 0 });
  });

  it("keeps the lines that contain the text, whatever its case, and counts the others", () => {
    const result = filterByText(view(...entries), "usdc");
    expect(tickers(result.view)).toEqual(["USDC"]);
    expect(result.hidden).toBe(2);
  });

  it("asks for every word, in any field", () => {
    expect(tickers(filterByText(view(...entries), "ethereum eth").view)).toEqual(["ETH"]);
    expect(tickers(filterByText(view(...entries), "base dai").view)).toEqual(["DAI"]);
    expect(tickers(filterByText(view(...entries), "ethereum dai").view)).toEqual([]);
  });

  it("looks the account up too", () => {
    const other = balance("native", "BNB", "bsc", "bsc:0xfeed");
    expect(tickers(filterByText(view(...entries, other), "feed").view)).toEqual(["BNB"]);
  });

  it("searches the operations by hash and by the assets they changed", () => {
    const delta: PortfolioAssetView = {
      network: "base",
      asset: "native",
      ticker: "ETH",
      amount: "1",
    };
    const fee: PortfolioAssetView = { ...delta, ticker: "ETH" };
    const operation = (hash: string) => ({
      network: "base",
      accountId: "a",
      time: "2026-01-01T00:00:00Z",
      hash,
      failed: false,
      pending: false,
      deltas: [delta],
      fee,
    });
    const updates: AccountPortfolioView = {
      kind: "updates",
      hasMore: false,
      operations: [operation("0xabc"), operation("0xdef")],
    };
    const result = filterByText(updates, "0xdef");
    expect(result.view.kind === "updates" && result.view.operations.map(o => o.hash)).toEqual([
      "0xdef",
    ]);
    expect(result.hidden).toBe(1);
  });

  it("does not touch results that have no lines to search", () => {
    const portfolio: AccountPortfolioView = {
      kind: "portfolio",
      id: "p",
      registrations: 0,
      registrationEntries: [],
      accounts: [],
    };
    expect(filterByText(portfolio, "zzz")).toEqual({ view: portfolio, hidden: 0 });
    expect(isSearchable(portfolio)).toBe(false);
    expect(isSearchable(view())).toBe(true);
    expect(isSearchable(undefined)).toBe(false);
  });
});
