import type { SyncState } from "./types";
import { useBridgeSyncState } from "./context";
const nothingState = {
  pending: false,
  error: null,
};
export function useAccountSyncState({
  accountId,
}: {
  accountId?: string | null;
} = {}): SyncState {
  const syncState = useBridgeSyncState();
  return (accountId && syncState[accountId]) || nothingState;
}
