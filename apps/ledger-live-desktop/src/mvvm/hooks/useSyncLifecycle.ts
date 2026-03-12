import { useEffect, useReducer, useRef } from "react";

export type SyncPhase = "syncing" | "synced" | "failed";

type Action = { type: "SYNC_BEGIN" } | { type: "SYNC_COMPLETE"; hasError: boolean };

function syncPhaseReducer(state: SyncPhase, action: Action): SyncPhase {
  switch (action.type) {
    case "SYNC_BEGIN":
      return "syncing";
    case "SYNC_COMPLETE":
      return action.hasError ? "failed" : "synced";
    default:
      return state;
  }
}

function getInitialSyncPhase(isBalanceLoading: boolean, hasAnySyncError: boolean): SyncPhase {
  if (isBalanceLoading) return "syncing";
  if (hasAnySyncError) return "failed";
  return "synced";
}

/**
 * After `isSyncSettled` becomes true while leaving a syncing cycle, wait this
 * long before committing the phase. If `isSyncSettled` bounces back to false
 * during this window (sub-account discovery, retry, etc.), the timer resets.
 * This prevents the syncing → synced → failed flash.
 */
export const SYNC_SETTLE_GUARD_MS = 3_000;

/**
 * FSM driving the TopBar indicator and balance shimmer.
 *
 * Phases: syncing -> synced | failed.
 *
 * SYNC_BEGIN fires on cold start / manual refresh.
 * SYNC_COMPLETE fires on settle, deferred by SYNC_SETTLE_GUARD_MS
 * when leaving syncing to absorb bouncing settle states.
 */
export function useSyncLifecycle(
  isBalanceLoading: boolean,
  stableSyncPending: boolean,
  hasAnySyncError: boolean,
): SyncPhase {
  const isSyncSettled = !isBalanceLoading && !stableSyncPending;

  const hasAnySyncErrorRef = useRef(hasAnySyncError);
  hasAnySyncErrorRef.current = hasAnySyncError;

  const prevSettledRef = useRef(isSyncSettled);
  const wasSyncingRef = useRef(!isSyncSettled);

  const [phase, dispatch] = useReducer(
    syncPhaseReducer,
    getInitialSyncPhase(isBalanceLoading, hasAnySyncError),
  );

  useEffect(() => {
    if (isBalanceLoading) {
      wasSyncingRef.current = true;
      dispatch({ type: "SYNC_BEGIN" });
    }
  }, [isBalanceLoading]);

  useEffect(() => {
    const wasSettled = prevSettledRef.current;
    prevSettledRef.current = isSyncSettled;

    if (!isSyncSettled || wasSettled) return;

    if (wasSyncingRef.current) {
      if (hasAnySyncErrorRef.current) {
        wasSyncingRef.current = false;
        dispatch({ type: "SYNC_COMPLETE", hasError: true });
        return;
      }
      const timer = setTimeout(() => {
        wasSyncingRef.current = false;
        dispatch({ type: "SYNC_COMPLETE", hasError: hasAnySyncErrorRef.current });
      }, SYNC_SETTLE_GUARD_MS);
      return () => clearTimeout(timer);
    }

    dispatch({ type: "SYNC_COMPLETE", hasError: hasAnySyncErrorRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncSettled]);

  return phase;
}
