import { useCallback, useSyncExternalStore } from "react";
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
