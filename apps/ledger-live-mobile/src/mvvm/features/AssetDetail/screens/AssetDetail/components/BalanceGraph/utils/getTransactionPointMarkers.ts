/**
 * Minimum spacing, expressed in series-points (data indices, not pixels), between
 * two RECEIVE/SEND markers. Transactions closer than this to the current cluster's
 * anchor are merged into it, capping marker density to at most one every N points.
 *
 * This is applied to the indices of the *rendered* series, which the caller resamples
 * to a per-range target granularity (see RANGE_TARGET_INTERVAL_MS). Spacing is therefore
 * a fraction of the visible width (≈ N / point-count) and stays roughly constant in
 * pixels across ranges, rather than a fixed wall-clock window. Tune here to taste.
 */
export const MIN_SERIES_POINTS_BETWEEN_TX_MARKERS = 20;

export type TransactionInput = Readonly<{
  dateMs: number;
  direction: "in" | "out";
  fiat: number | null;
}>;

export type TransactionChartGroup = Readonly<{
  index: number;
  value: number;
  dateMs: number;
  receivedCount: number;
  sentCount: number;
  receivedFiat: number;
  sentFiat: number;
}>;

type GroupTransactionsByChartIndexParams = Readonly<{
  timestamps: number[];
  values: number[];
  transactions: TransactionInput[];
  /**
   * Minimum gap, in series-points, between two emitted markers.
   * @default MIN_SERIES_POINTS_BETWEEN_TX_MARKERS
   */
  minSeriesPointsBetweenMarkers?: number;
}>;

function advanceNearestChartIndex(
  timestamps: number[],
  dateMs: number,
  nearestIndex: number,
): number {
  let index = nearestIndex;
  while (
    index + 1 < timestamps.length &&
    Math.abs(timestamps[index + 1] - dateMs) < Math.abs(timestamps[index] - dateMs)
  ) {
    index += 1;
  }
  return index;
}

function createEmptyChartGroup(
  nearestIndex: number,
  value: number,
  dateMs: number,
): TransactionChartGroup {
  return {
    index: nearestIndex,
    value,
    dateMs,
    receivedCount: 0,
    sentCount: 0,
    receivedFiat: 0,
    sentFiat: 0,
  };
}

function mergeTransactionIntoGroup(
  existing: TransactionChartGroup,
  direction: TransactionInput["direction"],
  fiat: number | null,
): TransactionChartGroup {
  const fiatValue = fiat == null || Number.isNaN(fiat) ? 0 : fiat;
  return {
    ...existing,
    receivedCount: existing.receivedCount + (direction === "in" ? 1 : 0),
    sentCount: existing.sentCount + (direction === "out" ? 1 : 0),
    receivedFiat: existing.receivedFiat + (direction === "in" ? fiatValue : 0),
    sentFiat: existing.sentFiat + (direction === "out" ? fiatValue : 0),
  };
}

/**
 * Groups transactions onto chart data points within the visible window, aggregating
 * received/sent counts and fiat totals. Marker density is capped so two markers are
 * never closer than `minSeriesPointsBetweenMarkers` series-points apart: a transaction
 * within that gap of the current cluster's anchor is merged into it, otherwise it opens
 * a new marker. Transactions outside the window or mapping to a point with a missing
 * value are dropped. Null fiat values are excluded from the totals but still counted.
 *
 * Both the chart timestamps and (after sorting) the transactions are ascending, so the
 * nearest data point only ever moves forward. We sweep them with a single shared pointer:
 * O(n + m) for the merge, plus O(m log m) to sort the transactions — instead of a nearest
 * lookup per transaction. On a tie, the lower index wins (the pointer does not advance).
 */
export function groupTransactionsByChartIndex({
  timestamps,
  values,
  transactions,
  minSeriesPointsBetweenMarkers = MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
}: GroupTransactionsByChartIndexParams): TransactionChartGroup[] {
  if (timestamps.length < 2) return [];

  const windowStart = timestamps[0];
  const windowEnd = timestamps.at(-1)!;

  const transactionsInWindow = transactions
    .filter(({ dateMs }) => dateMs >= windowStart && dateMs <= windowEnd)
    .sort((a, b) => a.dateMs - b.dateMs);

  const groups: TransactionChartGroup[] = [];
  let nearestIndex = 0;

  for (const { dateMs, direction, fiat } of transactionsInWindow) {
    nearestIndex = advanceNearestChartIndex(timestamps, dateMs, nearestIndex);

    const value = values[nearestIndex];
    if (value == null || Number.isNaN(value)) continue;

    // Anchor of the current cluster (markers and transactions are both ascending,
    // so the last group always holds the smallest, left-most index of its cluster).
    const last = groups[groups.length - 1];
    if (last && nearestIndex - last.index < minSeriesPointsBetweenMarkers) {
      groups[groups.length - 1] = mergeTransactionIntoGroup(last, direction, fiat);
      continue;
    }

    groups.push(
      mergeTransactionIntoGroup(
        createEmptyChartGroup(nearestIndex, value, dateMs),
        direction,
        fiat,
      ),
    );
  }

  return groups;
}
