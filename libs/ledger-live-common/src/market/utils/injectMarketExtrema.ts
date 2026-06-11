import { ChartDataPoint } from "./types";

export type MarketExtrema = Readonly<{
  ath?: number;
  athDate?: Date | number;
  atl?: number;
  atlDate?: Date | number;
}>;

function toTimestamp(date?: Date | number): number | undefined {
  if (date == null) return undefined;
  const ts = date instanceof Date ? date.getTime() : date;
  return Number.isFinite(ts) ? ts : undefined;
}

/**
 * Inserts a single [timestamp, value] point into a series already sorted by
 * timestamp. If a point already shares the timestamp, its value is reconciled
 * with `reconcile` (Math.max for highs, Math.min for lows) so we never lower a
 * real high or raise a real low.
 */
function insertSorted(
  points: ChartDataPoint[],
  timestamp: number,
  value: number,
  reconcile: (a: number, b: number) => number,
): void {
  const index = points.findIndex(([ts]) => ts >= timestamp);
  if (index === -1) {
    points.push([timestamp, value]);
    return;
  }
  if (points[index][0] === timestamp) {
    points[index] = [timestamp, reconcile(points[index][1], value)];
    return;
  }
  points.splice(index, 0, [timestamp, value]);
}

/**
 * Anchors the market all-time high/low onto a price chart series.
 *
 * The graph's high/low markers are derived from the extrema of the rendered
 * series, whereas the market stats table shows the precise `ath`/`atl` scalars
 * from the market API. On the "all" range both claim to show the all-time
 * extreme, so a downsampled series whose peak falls between two points diverges
 * from the table. Injecting the exact ATH/ATL points (at their real dates) makes
 * the line reach those values and keeps both surfaces consistent.
 *
 * Returns a new array; the input is not mutated. Values must already be in the
 * same counter-currency as `ath`/`atl`.
 */
export function injectMarketExtrema(
  points: readonly ChartDataPoint[],
  { ath, athDate, atl, atlDate }: MarketExtrema,
): ChartDataPoint[] {
  if (points.length === 0) return points.slice();

  // Shallow copy is enough: insertSorted only inserts new tuples or replaces a
  // colliding one, it never mutates an existing tuple in place.
  const result = points.slice();

  const athTs = toTimestamp(athDate);
  if (ath != null && Number.isFinite(ath) && ath > 0 && athTs != null) {
    insertSorted(result, athTs, ath, Math.max);
  }

  const atlTs = toTimestamp(atlDate);
  if (atl != null && Number.isFinite(atl) && atl > 0 && atlTs != null) {
    insertSorted(result, atlTs, atl, Math.min);
  }

  return result;
}
