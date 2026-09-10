import type { TrackingPair } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@domain/entity-currency";
import type { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { inferTrackingPairForAccounts } from "./trackingPairs";

// Sorted by code unit, not localeCompare: the hash is a cache key and must not vary with locale.
function trackingPairsHash(a: TrackingPair[]) {
  return a
    .map(p => `${p.from.ticker}:${p.to.ticker}:${p.startDate.toISOString().slice(0, 10) || ""}`)
    .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))
    .join("|");
}

export function useTrackingPairForAccounts(
  accounts: Account[],
  countervalue: Currency,
): TrackingPair[] {
  // first we cache the tracking pairs with its hash
  const c = useMemo(() => {
    const pairs = inferTrackingPairForAccounts(accounts, countervalue);
    return { pairs, hash: trackingPairsHash(pairs) };
  }, [accounts, countervalue]);
  // we only want to return the pairs when the hash changes
  // to not recalculate pairs as fast as accounts resynchronizes
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => c.pairs, [c.hash]);
}
