import type { SyncState } from "./types";
import { useBridgeSyncState } from "./context";
const nothingState = {
  pending: false,
  error: null,
};
export function useAccountSyncState({
  accountId,
}: {
  accountId: string;
}): SyncState {
  const syncState = useBridgeSyncState();
  return syncState[accountId] || nothingState;
}
