import type { BalanceGroup, BalanceHistoryGroup, UpdateView } from "@domain/api-account-portfolio";
import {
  toAssetView,
  toBalanceView,
  toHistoryView,
  toPortfolioView,
  toUpdatesView,
} from "./viewMappers";

const change = {
  asset: "eth",
  cal_id: null,
  ticker: null,
  name: null,
  decimals: null,
  amount: "5",
  currency_value: null,
};

describe("toAssetView", () => {
  it("turns the nulls of the service into absent fields", () => {
    expect(toAssetView("base", change)).toEqual({
      network: "base",
      asset: "eth",
      calId: undefined,
      ticker: undefined,
      name: undefined,
      decimals: undefined,
      amount: "5",
      currencyValue: undefined,
    });
  });

  it("keeps what the service knows", () => {
    const view = toAssetView("base", { ...change, ticker: "ETH", decimals: 18, currency_value: 2 });
    expect(view).toMatchObject({ ticker: "ETH", decimals: 18, currencyValue: 2 });
  });
});

describe("toBalanceView", () => {
  const groups = [
    {
      type: "success",
      network: "base",
      account_id: "a",
      items: [
        {
          ...change,
          network: "base",
          account_id: "a",
          status: "confirmed",
          estimated: false,
          locked: true,
        },
      ],
    },
    { type: "error", network: "base", account_id: "b", error: "boom" },
  ] as unknown as BalanceGroup[];

  it("lists the entries of the accounts read and the failure of the others", () => {
    const view = toBalanceView(groups, true);
    expect(view).toMatchObject({ kind: "balance", hasMore: true });
    if (view.kind !== "balance") throw new Error("not a balance");
    expect(view.entries).toHaveLength(1);
    expect(view.entries[0]).toMatchObject({ accountId: "a", status: "confirmed", locked: true });
    expect(view.failures).toEqual([{ network: "base", accountId: "b", error: "boom" }]);
  });
});

describe("toHistoryView", () => {
  const groups = [
    {
      type: "success",
      network: "base",
      account_id: "a",
      items: [{ ...change, network: "base", account_id: "a", value: "7", time: "2026-01-01" }],
    },
    { type: "error", network: "base", account_id: "b", error: "boom" },
  ] as unknown as BalanceHistoryGroup[];

  it("reads a point's value as its amount and keeps the token of the next page", () => {
    const view = toHistoryView(groups, "next");
    if (view.kind !== "history") throw new Error("not a history");
    expect(view.points).toEqual([
      expect.objectContaining({ accountId: "a", amount: "7", time: "2026-01-01" }),
    ]);
    expect(view.failures).toHaveLength(1);
    expect(view.hasMore).toBe(true);
    expect(view.nextToken).toBe("next");
  });

  it("has no more page without a token", () => {
    for (const token of [null, undefined, ""]) {
      expect(toHistoryView([], token)).toMatchObject({ hasMore: false, nextToken: undefined });
    }
  });
});

describe("toUpdatesView", () => {
  const update = (block: unknown) =>
    ({
      network: "base",
      account_id: "a",
      time: "t",
      tx: { hash: "0x1" },
      failed: false,
      block,
      deltas: undefined,
      fee: change,
    }) as unknown as UpdateView;

  it("marks an operation without a block as pending", () => {
    const view = toUpdatesView([update(undefined), update({ height: 1 })], false);
    if (view.kind !== "updates") throw new Error("not updates");
    expect(view.operations.map(operation => operation.pending)).toEqual([true, false]);
    expect(view.operations[0].deltas).toEqual([]);
  });
});

describe("toPortfolioView", () => {
  it("names a registration by its address, or by its network and xpub", () => {
    const view = toPortfolioView({
      id: "p",
      registrations: [
        { id: "1", type: "account", address: "0xabc" },
        { id: "2", type: "account", network: "bitcoin", xpub: "xpub1234567890abcdef" },
        { id: "3", type: "account" },
      ],
    } as unknown as Parameters<typeof toPortfolioView>[0]);
    if (view.kind !== "portfolio") throw new Error("not a portfolio");
    expect(view.registrations).toBe(3);
    expect(view.registrationEntries.map(entry => entry.detail)).toEqual([
      "0xabc",
      "bitcoin xpub12345678…",
      "",
    ]);
    expect(view.accounts).toEqual([]);
  });
});
