import type { PortfolioBalanceView } from "../types";

/** One asset of one account: what it holds, and what is still on its way. */
export interface BalanceRowModel {
  /** The confirmed entry, or the pending one when there is no confirmed one. */
  readonly entry: PortfolioBalanceView;
  /** A pending entry that differs from the confirmed one: the balance is about to change. */
  readonly pending?: PortfolioBalanceView;
  /** The asset has no confirmed balance yet. */
  readonly pendingOnly: boolean;
}

const keyOf = (entry: PortfolioBalanceView) => `${entry.accountId}:${entry.asset}`;

/**
 * The service answers each asset twice, confirmed and pending, and they are most often the same.
 * This gives one row per asset, and keeps the pending side only when it says something else. The
 * rows come in the order each asset first appeared.
 */
export function mergeBalances(entries: readonly PortfolioBalanceView[]): BalanceRowModel[] {
  const groups = new Map<
    string,
    { confirmed?: PortfolioBalanceView; pending?: PortfolioBalanceView }
  >();
  for (const entry of entries) {
    const group = groups.get(keyOf(entry)) ?? {};
    if (entry.status === "confirmed") group.confirmed ??= entry;
    else group.pending ??= entry;
    groups.set(keyOf(entry), group);
  }
  return [...groups.values()].flatMap(({ confirmed, pending }) => {
    const entry = confirmed ?? pending;
    if (!entry) return [];
    return [
      {
        entry,
        pending: confirmed && pending && pending.amount !== confirmed.amount ? pending : undefined,
        pendingOnly: confirmed === undefined,
      },
    ];
  });
}

export interface BalanceTotals {
  /** Worth of the rows that have a value, in the requested currency. */
  readonly fiat: number;
  readonly assets: number;
  readonly accounts: number;
  /** Rows the service gave no value for: they are left out of `fiat`. */
  readonly unvalued: number;
}

export function balanceTotals(rows: readonly BalanceRowModel[]): BalanceTotals {
  return {
    fiat: rows.reduce((sum, { entry }) => sum + (entry.currencyValue ?? 0), 0),
    assets: rows.length,
    accounts: new Set(rows.map(({ entry }) => entry.accountId)).size,
    unvalued: rows.filter(({ entry }) => entry.currencyValue === undefined).length,
  };
}
