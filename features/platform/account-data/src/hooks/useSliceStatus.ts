import { useCallback, useRef, useSyncExternalStore } from "react";
import type { AccountId } from "@shared/schema-primitives";
import { IDLE_SLICE_STATUS, type AccountSlice, type SliceStatus } from "../port";
import { useAccountDataScheduler } from "../provider";

/**
 * Freshness and error of one `(account, slice)` pair.
 *
 * Kept out of Redux: pending/error is ephemeral per-run state, and putting it in the store would
 * mean an action per shimmer. The scheduler holds it and hands out stable references, so a component
 * re-renders only when *its* pair changes — not when any account anywhere starts syncing.
 */
export function useSliceStatus(accountId: AccountId | undefined, slice: AccountSlice): SliceStatus {
  const scheduler = useAccountDataScheduler();

  const subscribe = useCallback(
    (onChange: () => void) => scheduler?.subscribeStatus(onChange) ?? (() => {}),
    [scheduler],
  );

  const getSnapshot = useCallback(
    () => (scheduler && accountId ? scheduler.getStatus(accountId, slice) : IDLE_SLICE_STATUS),
    [scheduler, accountId, slice],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const NO_STATUSES: readonly SliceStatus[] = [];

/**
 * The same, for many accounts at once — a list view's version of `useSliceStatus`.
 *
 * A list cannot call `useSliceStatus` in a loop, and reading `getStatus` inside a `useMemo` does not
 * work either: nothing invalidates that memo when a status changes, so `pending` never appears and a
 * failure that writes no data is never shown at all. Subscribing once and snapshotting the whole row
 * set is the only correct shape.
 *
 * `accountIds` must be referentially stable across renders — a fresh array each render rebuilds the
 * snapshot callback and re-subscribes on every commit.
 */
export function useSliceStatuses(
  accountIds: readonly AccountId[],
  slice: AccountSlice,
): readonly SliceStatus[] {
  const scheduler = useAccountDataScheduler();

  const subscribe = useCallback(
    (onChange: () => void) => scheduler?.subscribeStatus(onChange) ?? (() => {}),
    [scheduler],
  );

  // `useSyncExternalStore` re-renders whenever the snapshot's identity changes, so returning a fresh
  // array per call would loop forever. The scheduler hands out a stable reference per pair, which is
  // exactly what lets us hand back the previous array when every element is unchanged.
  const previous = useRef<readonly SliceStatus[]>(NO_STATUSES);

  const getSnapshot = useCallback(() => {
    const next = accountIds.map(accountId =>
      scheduler ? scheduler.getStatus(accountId, slice) : IDLE_SLICE_STATUS,
    );
    const prev = previous.current;
    if (prev.length === next.length && prev.every((status, i) => status === next[i])) return prev;
    previous.current = next;
    return next;
  }, [scheduler, accountIds, slice]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
