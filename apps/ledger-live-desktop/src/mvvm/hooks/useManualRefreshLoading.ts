import { useEffect, useReducer, useRef } from "react";

type Phase = "idle" | "waitingForSync" | "syncing";
type Event = "click" | "syncStarted" | "syncDone";

/**
 * State machine for manual refresh lifecycle:
 *   idle → (click) → waitingForSync → (syncStarted) → syncing → (syncDone) → idle
 */
function reducer(phase: Phase, event: Event): Phase {
  switch (event) {
    case "click":
      return "waitingForSync";
    case "syncStarted":
      return phase === "waitingForSync" ? "syncing" : phase;
    case "syncDone":
      return phase === "syncing" || phase === "waitingForSync" ? "idle" : phase;
    default:
      return phase;
  }
}

/**
 * Tracks whether a user-triggered manual refresh is in progress.
 *
 * Latches on when a click is detected and releases once the sync completes.
 */
export function useManualRefreshLoading(
  stableSyncPending: boolean,
  lastUserSyncClickTimestamp: number,
): boolean {
  const [phase, send] = useReducer(reducer, "idle");
  const prevTimestampRef = useRef(lastUserSyncClickTimestamp);

  useEffect(() => {
    if (lastUserSyncClickTimestamp !== prevTimestampRef.current) {
      prevTimestampRef.current = lastUserSyncClickTimestamp;
      send("click");
    }
  }, [lastUserSyncClickTimestamp]);

  useEffect(() => {
    send(stableSyncPending ? "syncStarted" : "syncDone");
  }, [stableSyncPending]);

  return phase !== "idle";
}
