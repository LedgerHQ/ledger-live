import { useEffect, useState } from "react";
import { useAccountSyncState, useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import type { Account } from "@ledgerhq/types-live";
import { isPositionDataStale } from "@features/flow-stake-position";

/**
 * Syncs the account once when the dialog opens with outdated data. Returns whether the position may
 * still change: the sync is queued or running. A failed sync ends the wait, so the user is never
 * stuck on outdated data that cannot be refreshed.
 */
export function useStakePositionSyncOnOpen(account: Account): boolean {
  const sync = useBridgeSync();
  const { pending, error } = useAccountSyncState({ accountId: account.id });
  const accountId = account.id;
  const lastSyncTime = account.lastSyncDate.getTime();
  const [outdatedSyncTime] = useState(() =>
    isPositionDataStale(lastSyncTime, Date.now()) ? lastSyncTime : null,
  );

  useEffect(() => {
    if (outdatedSyncTime === null) return;
    sync({ type: "SYNC_ONE_ACCOUNT", accountId, priority: 10, reason: "stake-position-open" });
  }, [sync, accountId, outdatedSyncTime]);

  const isWaitingForSync = outdatedSyncTime === lastSyncTime && !error;
  return pending || isWaitingForSync;
}
