import type { BalanceGroup } from "@domain/api-account-portfolio";
import { ETH, entry, group, serverAccountId } from "../fakeService.mock";
import { verdictOf } from "./verdict";

const readOf = (groups: BalanceGroup[], truncated = false) => ({
  groups: new Map(groups.map(each => [each.account_id, each])),
  truncated,
});

describe("verdictOf", () => {
  it("serves the native coin first, locked parts not spendable, pending ignored when confirmed", () => {
    const read = readOf([
      group(ETH, [
        entry(ETH, { asset: "token", cal_id: "ethereum/erc20/usdt", amount: "5" }),
        entry(ETH, { asset: "token", cal_id: null }),
        entry(ETH, { amount: "7" }),
        entry(ETH, { amount: "3", locked: true }),
        entry(ETH, { amount: "100", status: "pending" }),
      ]),
    ]);
    expect(verdictOf(ETH, serverAccountId(ETH), read)).toEqual({
      status: "served",
      rows: [
        { assetId: "ethereum", balance: "10", spendableBalance: "7" },
        { assetId: "ethereum/erc20/usdt", balance: "5", spendableBalance: "5" },
      ],
      detail: "1 tokens without a CAL id left out",
    });
  });

  it("serves a zero native balance when the service has no group for it", () => {
    expect(verdictOf(ETH, serverAccountId(ETH), readOf([]))).toEqual({
      status: "served",
      rows: [{ assetId: "ethereum", balance: "0", spendableBalance: "0" }],
    });
  });

  it("puts a zero native coin first when the service lists only tokens", () => {
    expect(
      verdictOf(
        ETH,
        serverAccountId(ETH),
        readOf([group(ETH, [entry(ETH, { asset: "token", cal_id: "t" })])]),
      ),
    ).toMatchObject({
      status: "served",
      rows: [{ assetId: "ethereum", balance: "0" }, { assetId: "t" }],
    });
  });

  it("fails an account whose own filtered call failed", () => {
    expect(
      verdictOf(ETH, serverAccountId(ETH), {
        ...readOf([]),
        failed: new Set([serverAccountId(ETH)]),
      }),
    ).toEqual({
      status: "failed",
      detail: "Its balance call failed",
    });
  });

  it.each<{ reason: string; groups: BalanceGroup[]; truncated?: boolean; detail: string }>([
    {
      reason: "its group failed",
      groups: [
        { type: "error", network: "ethereum", account_id: serverAccountId(ETH), error: "boom" },
      ],
      detail: "The service failed its group",
    },
    {
      reason: "an amount is unreadable",
      groups: [group(ETH, [entry(ETH), entry(ETH, { asset: "token", cal_id: "t", amount: "x" })])],
      detail: "1 assets with an unreadable amount",
    },
    {
      reason: "the scan stopped before it",
      groups: [],
      truncated: true,
      detail: "The balance scan stopped before the end",
    },
    {
      reason: "the scan stopped after one of its groups, as more can follow",
      groups: [group(ETH)],
      truncated: true,
      detail: "The balance scan stopped before the end",
    },
  ])("fails when $reason", ({ groups, truncated, detail }) => {
    expect(verdictOf(ETH, serverAccountId(ETH), readOf(groups, truncated))).toEqual({
      status: "failed",
      detail,
    });
  });

  it("fails a group the service failed, even when it carries items", () => {
    const failed = { ...group(ETH), error: "timeout" };
    expect(verdictOf(ETH, serverAccountId(ETH), readOf([failed]))).toEqual({
      status: "failed",
      detail: "The service failed its group",
    });
  });

  it("fails a group holding an entry of another account, rather than serving it", () => {
    const stray = group(ETH, [entry(ETH), entry(ETH, { account_id: "ethereum:0xother" })]);
    expect(verdictOf(ETH, serverAccountId(ETH), readOf([stray]))).toEqual({
      status: "failed",
      detail: "The service answered with another account's balances",
    });
  });

  it("fails a group holding an entry of another network", () => {
    const stray = group(ETH, [entry(ETH, { network: "polygon" })]);
    expect(verdictOf(ETH, serverAccountId(ETH), readOf([stray]))).toMatchObject({
      status: "failed",
    });
  });
});
