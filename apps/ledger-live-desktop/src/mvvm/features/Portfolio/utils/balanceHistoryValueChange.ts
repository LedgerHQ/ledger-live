import type { CountervalueTicker } from "@domain/entity-account-balance";
import type { AssetBalanceHistory } from "@domain/entity-account-balance-history";
import type { BalanceHistory, ValueChange } from "@ledgerhq/types-live";

const PERCENTAGE_HIGH_THRESHOLD = 100_000;

export type BalanceHistoryValueChange = {
  balanceHistory: BalanceHistory;
  valueChange: ValueChange;
};

function meaningfulPercentage(delta: number, divider: number): number | undefined {
  if (!delta || !divider) return undefined;
  const percent = delta / divider;
  return percent < PERCENTAGE_HIGH_THRESHOLD ? percent : undefined;
}

function countervalueOf(
  point: AssetBalanceHistory["points"][number],
  ticker: CountervalueTicker,
): number | undefined {
  const raw = point.countervalues?.[ticker];
  if (raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function assetWorth(
  series: AssetBalanceHistory,
  ticker: CountervalueTicker,
): { date: number; value: number }[] | undefined {
  const points = [...series.points].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
  const worth: { date: number; value: number }[] = [];
  let carried: number | undefined;
  for (const point of points) {
    const value = countervalueOf(point, ticker);
    if (value !== undefined) carried = value;
    if (carried === undefined) return undefined;
    worth.push({ date: new Date(point.date).getTime(), value: carried });
  }
  return worth;
}

function worthAt(series: readonly { date: number; value: number }[], date: number): number {
  let value = 0;
  for (const point of series) {
    if (point.date > date) break;
    value = point.value;
  }
  return value;
}

export function balanceHistoryValueChange(
  accounts: readonly (readonly AssetBalanceHistory[])[],
  ticker: CountervalueTicker,
): BalanceHistoryValueChange | undefined {
  const series: { date: number; value: number }[][] = [];
  for (const account of accounts) {
    for (const asset of account) {
      const worth = assetWorth(asset, ticker);
      if (!worth) return undefined;
      if (worth.length > 0) series.push(worth);
    }
  }

  const dates = [...new Set(series.flatMap(asset => asset.map(point => point.date)))].sort(
    (left, right) => left - right,
  );
  if (dates.length === 0) return undefined;

  const balanceHistory: BalanceHistory = dates.map(date => ({
    date: new Date(date),
    value: series.reduce((sum, asset) => sum + worthAt(asset, date), 0),
  }));

  const firstSignificant = balanceHistory.find(point => point.value !== 0);
  const last = balanceHistory[balanceHistory.length - 1];
  const base = firstSignificant?.value ?? 0;
  const value = last.value - base;

  return {
    balanceHistory,
    valueChange: {
      value,
      percentage: meaningfulPercentage(value, base),
    },
  };
}

export function endBalanceHistoryAt(
  change: BalanceHistoryValueChange,
  currentWorth: number,
): BalanceHistoryValueChange {
  const history = change.balanceHistory;
  const last = history[history.length - 1];
  if (!last || last.value === currentWorth) return change;

  const balanceHistory = [...history.slice(0, -1), { date: last.date, value: currentWorth }];
  const base = balanceHistory.find(point => point.value !== 0)?.value ?? 0;
  const value = currentWorth - base;
  return {
    balanceHistory,
    valueChange: { value, percentage: meaningfulPercentage(value, base) },
  };
}
