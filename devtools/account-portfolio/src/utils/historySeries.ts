import type { PortfolioHistoryPointView } from "../types";

export interface HistorySample {
  /** Epoch milliseconds. */
  readonly time: number;
  /** What every asset of the portfolio is worth at that time, in the currency of the request. */
  readonly value: number;
}

export interface HistorySeries {
  readonly samples: readonly HistorySample[];
  /** Points left out: no currency value, or a time that is not a date. */
  readonly skipped: number;
}

/**
 * The portfolio's value over time: the points sharing a time are added up, then the times are put
 * in order.
 */
export function historySeries(points: readonly PortfolioHistoryPointView[]): HistorySeries {
  const byTime = new Map<number, number>();
  let skipped = 0;
  for (const point of points) {
    const time = Date.parse(point.time);
    if (Number.isNaN(time) || point.currencyValue === undefined) {
      skipped += 1;
      continue;
    }
    byTime.set(time, (byTime.get(time) ?? 0) + point.currencyValue);
  }
  const samples = [...byTime]
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time - b.time);
  return { samples, skipped };
}
