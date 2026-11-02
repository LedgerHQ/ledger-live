import { useEffect, useReducer, useRef } from "react";
import type { SyncState } from "@ledgerhq/live-common/bridge/react/types";

type RefreshPhase = "idle" | "waitingForSync" | "syncing";
type RefreshEvent = "click" | "syncStarted" | "syncDone";

function reducer(phase: RefreshPhase, event: RefreshEvent): RefreshPhase {
  switch (event) {
    case "click":
      return "waitingForSync";
    case "syncStarted":
      return phase === "waitingForSync" ? "syncing" : phase;
    case "syncDone":
      return "idle";
    default:
      return phase;
  }
}

/**
 * Same lifecycle as live-common `useManualRefresh`, plus completion on a sync error
 * published without a pending phase (e.g. the account bridge failing to load).
 * A new sync state object is required, so an error from before the click is ignored.
 */
export function useAccountManualRefresh(
  syncState: SyncState,
  stableSyncPending: boolean,
  lastClickTimestamp: number,
): boolean {
  const [phase, dispatch] = useReducer(reducer, "idle");
  const prevTimestampRef = useRef(lastClickTimestamp);

  useEffect(() => {
    if (lastClickTimestamp === prevTimestampRef.current) return;
    prevTimestampRef.current = lastClickTimestamp;
    dispatch("click");
  }, [lastClickTimestamp]);

  useEffect(() => {
    dispatch(stableSyncPending ? "syncStarted" : "syncDone");
  }, [stableSyncPending]);

  const prevSyncStateRef = useRef(syncState);
  useEffect(() => {
    if (syncState === prevSyncStateRef.current) return;
    prevSyncStateRef.current = syncState;
    if (!syncState.pending && syncState.error) dispatch("syncDone");
  }, [syncState]);

  return phase !== "idle";
}
