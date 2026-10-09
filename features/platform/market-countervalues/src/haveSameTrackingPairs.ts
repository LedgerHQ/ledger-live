import type { TrackingPair } from "@domain/entity-market-countervalues";

// Sorted by code unit, not localeCompare: the hash is a cache key and must not vary with locale.
function trackingPairsHash(pairs: readonly TrackingPair[]): string {
  return pairs
    .map(p => `${p.from.ticker}:${p.to.ticker}:${p.startDate.toISOString().slice(0, 10) || ""}`)
    .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))
    .join("|");
}

/**
 * Whether two lists track the same pairs, by ticker and start day, in any order: the rule
 * `useTrackingPairForAccounts` uses to keep the same pairs while accounts resynchronize. Use it as a
 * selector's result equality check so the countervalues settings only change with their pairs.
 */
export function haveSameTrackingPairs(
  a: readonly TrackingPair[],
  b: readonly TrackingPair[],
): boolean {
  return a === b || trackingPairsHash(a) === trackingPairsHash(b);
}
