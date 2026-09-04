import { useEffect, useRef } from "react";
import { accountRefSetKey, sliceSetKey } from "../internals";
import type { AccountRef, AccountSlice } from "../port";
import { useAccountDataScheduler } from "../provider";
import type { SubscribeOptions } from "../scheduler";

/**
 * Declare that the mounted view needs `slices` for these accounts, and release it on unmount.
 *
 * This is the polarity inversion the account migration is after: today the app syncs everything and
 * the UI reads whatever happens to be there; here the UI states its need and the scheduler satisfies
 * the minimum. A portfolio mounting forty rows registers forty `balance` demands and the scheduler
 * turns them into forty cheap balance reads — never forty full account syncs.
 *
 * Callers rebuild `refs` on every render, so the demand is keyed on the account ids rather than on
 * array identity: re-rendering a portfolio must not re-subscribe forty accounts.
 */
export function useAccountDataDemand(
  refs: readonly AccountRef[],
  slices: readonly AccountSlice[],
  options?: SubscribeOptions,
): void {
  const scheduler = useAccountDataScheduler();
  // Both keys identify a *set*, not a sequence: without the sort, re-ordering a portfolio would
  // release and re-register every demand even though nothing was added or removed. The ref key
  // covers every field, so a ref whose address or derivation mode changed under a stable id does
  // re-subscribe instead of leaving the scheduler on the stale one.
  const refsKey = accountRefSetKey(refs);
  const slicesKey = sliceSetKey(slices);
  const { maxAge, pollMs, reason } = options ?? {};

  const latest = useRef(refs);
  latest.current = refs;

  useEffect(() => {
    // Both keys guard the same trap: `"".split(",")` is `[""]`, which would register demand for a
    // slice that does not exist and come back as an unservable-slice error.
    if (!scheduler || refsKey === "" || slicesKey === "") return;
    const wanted = slicesKey.split(",") as AccountSlice[];
    const releases = latest.current.map(ref =>
      scheduler.subscribe(ref, wanted, { maxAge, pollMs, reason }),
    );
    return () => {
      for (const release of releases) release();
    };
  }, [scheduler, refsKey, slicesKey, maxAge, pollMs, reason]);
}
