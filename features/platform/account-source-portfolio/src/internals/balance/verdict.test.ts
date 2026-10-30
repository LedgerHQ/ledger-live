import type { BalanceGroup, Portfolio } from "@domain/api-account-portfolio";
import { serverAccountId } from "../../evm";
import { ETH, entry, evm, group, serviceAccount, synced } from "../fakeService.mock";
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
    expect(verdictOf(ETH, synced([ETH]), read)).toEqual({
      status: "served",
      rows: [
        { assetId: "ethereum", balance: "10", spendableBalance: "7" },
        { assetId: "ethereum/erc20/usdt", balance: "5", spendableBalance: "5" },
      ],
      detail: "1 tokens without a CAL id left out",
    });
  });

  it.each<{
    reason: string;
    portfolio: Portfolio;
    groups: BalanceGroup[];
    truncated?: boolean;
    verdict: object;
  }>([
    {
      reason: "the service account is not created yet",
      portfolio: synced([]),
      groups: [],
      verdict: { status: "waiting", detail: "Service account not created yet" },
    },
    {
      reason: "the service account is not synchronized",
      portfolio: synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }),
      groups: [],
      verdict: { status: "waiting", detail: "Service account uninitialized" },
    },
    {
      reason: "the fan-out does not track its network",
      portfolio: synced([], { accounts: [serviceAccount(evm(1, "bsc"))] }),
      groups: [],
      verdict: { status: "failed", detail: "The fan-out tracks no ethereum account" },
    },
    {
      reason: "its group failed",
      portfolio: synced([ETH]),
      groups: [
        { type: "error", network: "ethereum", account_id: serverAccountId(ETH), error: "boom" },
      ],
      verdict: { status: "failed", detail: "The service failed its group" },
    },
    {
      reason: "an amount is unreadable",
      portfolio: synced([ETH]),
      groups: [group(ETH, [entry(ETH), entry(ETH, { asset: "token", cal_id: "t", amount: "x" })])],
      verdict: { status: "failed", detail: "1 assets with an unreadable amount" },
    },
    {
      reason: "it has no native coin",
      portfolio: synced([ETH]),
      groups: [group(ETH, [entry(ETH, { asset: "token", cal_id: "t" })])],
      verdict: { status: "waiting", detail: "No native coin balance yet" },
    },
    {
      reason: "the scan stopped before it",
      portfolio: synced([ETH]),
      groups: [],
      truncated: true,
      verdict: { status: "failed", detail: "The balance scan stopped before it" },
    },
    {
      reason: "the service has no balance for it yet",
      portfolio: synced([ETH]),
      groups: [],
      verdict: { status: "waiting", detail: "No balance for it yet" },
    },
  ])("does not serve when $reason", ({ portfolio, groups, truncated, verdict }) => {
    expect(verdictOf(ETH, portfolio, readOf(groups, truncated))).toEqual(verdict);
  });
});
