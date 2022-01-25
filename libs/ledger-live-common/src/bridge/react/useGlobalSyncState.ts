import { useMemo } from "react";
import type { SyncState } from "./types";
import { useBridgeSyncState } from "./context";
export function useGlobalSyncState(): SyncState {
  const syncState = useBridgeSyncState();
  let pending = false;
  let error: null | Error = null;

  for (const k in syncState) {
    const s = syncState[k];
    if (s.error) error = s.error;
    if (s.pending) pending = true;
  }

  const globalState = useMemo(
    () => ({
      pending,
      error,
    }),
    [pending, error]
  );
  return globalState;
}
