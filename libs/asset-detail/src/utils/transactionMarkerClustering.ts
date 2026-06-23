/**
 * Minimum spacing, expressed in series-points (data indices, not pixels), between
 * two RECEIVE/SEND markers. Transactions closer than this to the current cluster's
 * anchor are merged into it, capping marker density to at most one every N points.
 *
 * Spacing is applied to the indices of the *rendered* series, which callers resample
 * to a per-range target granularity. It is therefore a fraction of the visible width
 * (≈ N / point-count) and stays roughly constant in pixels across ranges, rather than
 * a fixed wall-clock window.
 */
export const DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS = 20;

export type ChartTransactionClusteringRange = "1d" | "1w" | "1m" | "6m" | "1y" | "5y" | "all";

export const MIN_SERIES_POINTS_BETWEEN_TX_MARKERS_BY_RANGE: Record<
  ChartTransactionClusteringRange,
  number
> = {
  "1d": DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  "1w": DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  "1m": DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  "6m": DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  "1y": DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  "5y": 35,
  all: 50,
};

export function getMinSeriesPointsBetweenTxMarkers(range: ChartTransactionClusteringRange): number {
  return MIN_SERIES_POINTS_BETWEEN_TX_MARKERS_BY_RANGE[range];
}
