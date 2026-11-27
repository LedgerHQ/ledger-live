import { useEffect, useState } from "react";
import { useAccountSyncState, useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import type { Account } from "@ledgerhq/types-live";
import { isPositionDataStale, STAKE_POSITION_SYNC_WAIT_MS } from "@features/flow-stake-position";

/** Whether the sync asked for on open has been waited for long enough. */
function useSyncWaitOver(isAsked: boolean): boolean {
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (!isAsked) return;
    const timer = setTimeout(() => setIsOver(true), STAKE_POSITION_SYNC_WAIT_MS);
    return () => clearTimeout(timer);
  }, [isAsked]);

  return isOver;
}

/**
 * Syncs the account once when the dialog opens with outdated data. Returns whether the position may
 * still change: the sync is queued or running. A failed sync ends the wait, so the user is never
 * stuck on outdated data that cannot be refreshed. The error an earlier sync left on the account
 * is not that failure, it stays there until this sync starts: only a different error is. A sync
 * still queued after `STAKE_POSITION_SYNC_WAIT_MS` may have been dropped: the wait ends too.
 */
export function useStakePositionSyncOnOpen(account: Account): boolean {
  const sync = useBridgeSync();
  const { pending, error } = useAccountSyncState({ accountId: account.id });
  const accountId = account.id;
  const lastSyncTime = account.lastSyncDate.getTime();
  const [outdatedSyncTime] = useState(() =>
    isPositionDataStale(lastSyncTime, Date.now()) ? lastSyncTime : null,
  );
  const [errorOnOpen] = useState(error);
  const isWaitOver = useSyncWaitOver(outdatedSyncTime !== null);

  useEffect(() => {
    if (outdatedSyncTime === null) return;
    sync({ type: "SYNC_ONE_ACCOUNT", accountId, priority: 10, reason: "stake-position-open" });
  }, [sync, accountId, outdatedSyncTime]);

  const isWaitingForSync =
    !isWaitOver && outdatedSyncTime === lastSyncTime && (!error || error === errorOnOpen);
  return pending || isWaitingForSync;
}
