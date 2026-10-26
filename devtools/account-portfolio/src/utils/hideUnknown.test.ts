import type { AccountPortfolioView, PortfolioAssetView } from "../types";
import { hideUnknownTokens } from "./hideUnknown";

const asset = (name: string, calId?: string): PortfolioAssetView => ({
  network: "base",
  asset: name,
  calId,
  amount: "1",
});

describe("hideUnknownTokens", () => {
  it("hides balance entries that have no ledger id", () => {
    const view: AccountPortfolioView = {
      kind: "balance",
      hasMore: false,
      failures: [],
      entries: [
        {
          ...asset("native", "base"),
          accountId: "a",
          status: "confirmed",
          estimated: false,
          locked: false,
        },
        {
          ...asset("erc20.0x1"),
          accountId: "a",
          status: "confirmed",
          estimated: false,
          locked: false,
        },
      ],
    };

    const result = hideUnknownTokens(view);

    expect(result.hidden).toBe(1);
    expect(result.view.kind === "balance" && result.view.entries.map(entry => entry.asset)).toEqual(
      ["native"],
    );
  });

  it("keeps an operation that touches a known asset and drops its unknown changes", () => {
    const view: AccountPortfolioView = {
      kind: "updates",
      hasMore: false,
      operations: [
        {
          network: "base",
          accountId: "a",
          time: "2026-01-01T00:00:00Z",
          hash: "0x1",
          failed: false,
          pending: false,
          deltas: [asset("native", "base"), asset("erc20.0x1")],
          fee: asset("native", "base"),
        },
      ],
    };

    const result = hideUnknownTokens(view);

    expect(result.hidden).toBe(0);
    expect(result.view.kind === "updates" && result.view.operations[0].deltas).toHaveLength(1);
  });
});
