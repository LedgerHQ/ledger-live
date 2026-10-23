import type { AccountPortfolioView, PortfolioAssetView } from "../types";
import { hideUnknownTokens } from "./hideUnknown";

const asset = (name: string, calId?: string): PortfolioAssetView => ({
  network: "base",
  asset: name,
  calId,
  amount: "1",
});
const balance = (name: string, calId?: string) => ({
  ...asset(name, calId),
  accountId: "a",
  status: "confirmed" as const,
  estimated: false,
  locked: false,
});
const operation = (hash: string, deltas: PortfolioAssetView[]) => ({
  network: "base",
  accountId: "a",
  time: "2026-01-01T00:00:00Z",
  hash,
  failed: false,
  pending: false,
  deltas,
  fee: asset("native", "base"),
});

describe("hideUnknownTokens", () => {
  it("hides the balance entries that have no ledger id, and counts them", () => {
    const view: AccountPortfolioView = {
      kind: "balance",
      hasMore: false,
      failures: [{ network: "base", accountId: "b", error: "down" }],
      entries: [balance("native", "base"), balance("erc20.0x1"), balance("erc20.0x2")],
    };

    const result = hideUnknownTokens(view);

    expect(result.hidden).toBe(2);
    expect(result.view).toMatchObject({
      kind: "balance",
      failures: view.kind === "balance" ? view.failures : [],
    });
    expect(result.view.kind === "balance" && result.view.entries.map(e => e.asset)).toEqual([
      "native",
    ]);
  });

  it("keeps an operation that touches a known asset, with only its known changes", () => {
    const view: AccountPortfolioView = {
      kind: "updates",
      hasMore: false,
      operations: [operation("0x1", [asset("native", "base"), asset("erc20.0x1")])],
    };

    const result = hideUnknownTokens(view);

    expect(result.hidden).toBe(0);
    expect(result.view.kind === "updates" && result.view.operations[0].deltas).toHaveLength(1);
  });

  it("hides an operation whose changes are all on unknown assets", () => {
    const view: AccountPortfolioView = {
      kind: "updates",
      hasMore: false,
      operations: [
        operation("0x1", [asset("erc20.0x1")]),
        operation("0x2", [asset("native", "base")]),
      ],
    };

    const result = hideUnknownTokens(view);

    expect(result.hidden).toBe(1);
    expect(result.view.kind === "updates" && result.view.operations.map(o => o.hash)).toEqual([
      "0x2",
    ]);
  });

  it("keeps an operation that changed no balance", () => {
    const view: AccountPortfolioView = {
      kind: "updates",
      hasMore: false,
      operations: [operation("0x1", [])],
    };

    expect(hideUnknownTokens(view).hidden).toBe(0);
  });

  it("hides the history points that have no ledger id", () => {
    const point = (name: string, calId?: string) => ({
      ...asset(name, calId),
      accountId: "a",
      time: "2026-01-01T00:00:00Z",
    });
    const view: AccountPortfolioView = {
      kind: "history",
      hasMore: false,
      failures: [],
      points: [point("native", "base"), point("erc20.0x1")],
    };

    const result = hideUnknownTokens(view);

    expect(result.hidden).toBe(1);
    expect(result.view.kind === "history" && result.view.points).toHaveLength(1);
  });

  it("leaves a portfolio view as it is", () => {
    const view: AccountPortfolioView = {
      kind: "portfolio",
      id: "p",
      registrations: 0,
      registrationEntries: [],
      accounts: [],
    };
    expect(hideUnknownTokens(view)).toEqual({ view, hidden: 0 });
  });
});
