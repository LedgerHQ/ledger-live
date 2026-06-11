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
 * Groups transactions onto the nearest chart data point within the visible
 * window, aggregating received/sent counts and fiat totals per data point.
 * Transactions outside the window or mapping to a point with a missing value
 * are dropped. Null fiat values are excluded from the totals but still counted.
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
}: GroupTransactionsByChartIndexParams): TransactionChartGroup[] {
  if (timestamps.length < 2) return [];

  const windowStart = timestamps[0];
  const windowEnd = timestamps.at(-1)!;

  const transactionsInWindow = transactions
    .filter(({ dateMs }) => dateMs >= windowStart && dateMs <= windowEnd)
    .sort((a, b) => a.dateMs - b.dateMs);

  const groupsByIndex = new Map<number, TransactionChartGroup>();
  let nearestIndex = 0;

  for (const { dateMs, direction, fiat } of transactionsInWindow) {
    nearestIndex = advanceNearestChartIndex(timestamps, dateMs, nearestIndex);

    const value = values[nearestIndex];
    if (value == null || Number.isNaN(value)) continue;

    const existing =
      groupsByIndex.get(nearestIndex) ?? createEmptyChartGroup(nearestIndex, value, dateMs);

    groupsByIndex.set(nearestIndex, mergeTransactionIntoGroup(existing, direction, fiat));
  }

  return Array.from(groupsByIndex.values());
}
