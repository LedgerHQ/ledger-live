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
}>;

/** Finds the index of the timestamp closest to the given target time. */
function findNearestIndex(timestamps: number[], target: number): number {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < timestamps.length; index += 1) {
    const distance = Math.abs(timestamps[index] - target);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }
  return nearestIndex;
}

/**
 * Groups transactions onto the nearest chart data point within the visible
 * window, aggregating received/sent counts and fiat totals per data point.
 * Transactions outside the window or mapping to a point with a missing value
 * are dropped. Null fiat values are excluded from the totals but still counted.
 */
export function groupTransactionsByChartIndex({
  timestamps,
  values,
  transactions,
}: GroupTransactionsByChartIndexParams): TransactionChartGroup[] {
  if (timestamps.length < 2) return [];

  const windowStart = timestamps[0];
  const windowEnd = timestamps[timestamps.length - 1];
  const groupsByIndex = new Map<number, TransactionChartGroup>();

  for (const { dateMs, direction, fiat } of transactions) {
    if (dateMs < windowStart || dateMs > windowEnd) continue;

    const index = findNearestIndex(timestamps, dateMs);
    const value = values[index];
    if (value == null || Number.isNaN(value)) continue;

    const existing =
      groupsByIndex.get(index) ??
      ({
        index,
        value,
        dateMs,
        receivedCount: 0,
        sentCount: 0,
        receivedFiat: 0,
        sentFiat: 0,
      } satisfies TransactionChartGroup);

    const fiatValue = fiat == null || Number.isNaN(fiat) ? 0 : fiat;

    groupsByIndex.set(index, {
      ...existing,
      receivedCount: existing.receivedCount + (direction === "in" ? 1 : 0),
      sentCount: existing.sentCount + (direction === "out" ? 1 : 0),
      receivedFiat: existing.receivedFiat + (direction === "in" ? fiatValue : 0),
      sentFiat: existing.sentFiat + (direction === "out" ? fiatValue : 0),
    });
  }

  return Array.from(groupsByIndex.values());
}
