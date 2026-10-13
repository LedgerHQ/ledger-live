import type { TrackingPair } from "@domain/entity-market-countervalues";

/**
 * Whether two lists track the same pairs, by ticker and start day, in any order: the rule
 * `useTrackingPairForAccounts` uses to keep the same pairs while accounts resynchronize. Use it as a
 * selector's result equality check so the countervalues settings only change with their pairs.
 *
 * Each list is hashed once and its hash kept with it, so the previous result is not hashed again.
 * The lists must not be mutated after a check.
 */
export function haveSameTrackingPairs(
  a: readonly TrackingPair[],
  b: readonly TrackingPair[],
): boolean {
  return a === b || trackingPairsHash(a) === trackingPairsHash(b);
}

function trackingPairsHash(pairs: readonly TrackingPair[]): string {
  const cached = hashes.get(pairs);
  if (cached !== undefined) return cached;
  const hash = computeTrackingPairsHash(pairs);
  hashes.set(pairs, hash);
  return hash;
}

// Sorted by code unit, not localeCompare: the hash is a cache key and must not vary with locale.
function computeTrackingPairsHash(pairs: readonly TrackingPair[]): string {
  return pairs
    .map(p => `${p.from.ticker}:${p.to.ticker}:${p.startDate.toISOString().slice(0, 10) || ""}`)
    .sort(compareCodeUnits)
    .join("|");
}

function compareCodeUnits(x: string, y: string): number {
  if (x < y) return -1;
  return x > y ? 1 : 0;
}

const hashes = new WeakMap<readonly TrackingPair[], string>();
