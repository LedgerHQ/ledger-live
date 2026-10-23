import type {
  AssetChange,
  BalanceGroup,
  BalanceHistoryGroup,
  Portfolio,
  PortfolioRegistrationEntry,
  UpdateView,
} from "@domain/api-account-portfolio";
import type { PortfolioView } from "./types";

type AssetView = Extract<PortfolioView, { kind: "updates" }>["operations"][number]["fee"];

export const toAssetView = (
  network: string,
  asset: AssetChange | UpdateView["fee"],
): AssetView => ({
  network,
  asset: asset.asset,
  calId: asset.cal_id ?? undefined,
  ticker: asset.ticker ?? undefined,
  name: asset.name ?? undefined,
  decimals: asset.decimals ?? undefined,
  amount: asset.amount,
  currencyValue: asset.currency_value ?? undefined,
});

const registrationDetail = (registration: PortfolioRegistrationEntry): string => {
  const { address, network, xpub } = registration;
  if (typeof address === "string") return address;
  if (typeof xpub === "string") {
    return `${typeof network === "string" ? network : ""} ${xpub.slice(0, 12)}…`.trim();
  }
  return "";
};

export const toPortfolioView = (portfolio: Portfolio): PortfolioView => ({
  kind: "portfolio",
  id: portfolio.id,
  registrations: portfolio.registrations?.length ?? 0,
  registrationEntries: (portfolio.registrations ?? []).map(registration => ({
    id: registration.id,
    type: registration.type,
    detail: registrationDetail(registration),
  })),
  accounts: portfolio.accounts ?? [],
});

const failuresOf = (groups: readonly (BalanceGroup | BalanceHistoryGroup)[]) =>
  groups.flatMap(group =>
    "error" in group
      ? [{ network: group.network, accountId: group.account_id, error: group.error }]
      : [],
  );

export const toBalanceView = (
  groups: readonly BalanceGroup[],
  hasMore: boolean,
): PortfolioView => ({
  kind: "balance",
  hasMore,
  entries: groups.flatMap(group =>
    "items" in group
      ? group.items.map(entry => ({
          ...toAssetView(entry.network, entry),
          accountId: entry.account_id,
          status: entry.status,
          estimated: entry.estimated,
          locked: entry.locked,
        }))
      : [],
  ),
  failures: failuresOf(groups),
});

export const toHistoryView = (
  groups: readonly BalanceHistoryGroup[],
  nextToken: string | null | undefined,
): PortfolioView => ({
  kind: "history",
  hasMore: Boolean(nextToken),
  nextToken: nextToken || undefined,
  points: groups.flatMap(group =>
    "items" in group
      ? group.items.map(point => ({
          // A history point carries its value where an entry carries its amount.
          ...toAssetView(point.network, { ...point, amount: point.value }),
          accountId: point.account_id,
          time: point.time,
        }))
      : [],
  ),
  failures: failuresOf(groups),
});

export const toUpdatesView = (updates: readonly UpdateView[], hasMore: boolean): PortfolioView => ({
  kind: "updates",
  hasMore,
  operations: updates.map(update => ({
    network: update.network,
    accountId: update.account_id,
    time: update.time,
    hash: update.tx.hash,
    failed: update.failed,
    pending: !update.block,
    deltas: (update.deltas ?? []).map(delta => toAssetView(update.network, delta)),
    fee: toAssetView(update.network, update.fee),
  })),
});
