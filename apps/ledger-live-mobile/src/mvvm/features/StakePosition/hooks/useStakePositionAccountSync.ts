import { useEffect, useRef, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useAccountSyncState, useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { isPositionDataStale } from "@features/flow-stake-position";

// The bridge drops a queued sync when another one of the same priority is scheduled: past this
// wait, the sheet stops waiting for it rather than block the position for good.
export const STAKE_POSITION_SYNC_WAIT_MS = 20_000;

type SyncError = Error | null | undefined;

type OpeningSnapshot = Readonly<{ lastSyncTime: number; error: SyncError; isStale: boolean }>;

function snapshotOf(
  account: Account | undefined,
  error: SyncError,
  isOpen: boolean,
): OpeningSnapshot {
  const lastSyncTime = account?.lastSyncDate.getTime() ?? 0;
  return {
    lastSyncTime,
    error,
    isStale: isOpen && account !== undefined && isPositionDataStale(lastSyncTime, Date.now()),
  };
}

/**
 * Syncs the account once when an open request shows data the position rules find too old.
 * Returns whether the request still waits for that sync: until the account syncs again, the sync
 * fails, or the wait times out. Call it from a component keyed by the request.
 */
export function useStakePositionAccountSync(
  account: Account | undefined,
  isOpen: boolean,
): boolean {
  const sync = useBridgeSync();
  const { error } = useAccountSyncState({ accountId: account?.id });
  const [opening] = useState(() => snapshotOf(account, error, isOpen));
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const hasRequestedSync = useRef(false);
  const accountId = account?.id;

  useEffect(() => {
    if (!opening.isStale || !accountId || hasRequestedSync.current) return;
    hasRequestedSync.current = true;
    sync({
      type: "SYNC_ONE_ACCOUNT",
      accountId,
      priority: 10,
      reason: "stake-position-open",
    });
  }, [opening.isStale, accountId, sync]);

  useEffect(() => {
    if (!opening.isStale) return;
    const timer = setTimeout(() => setHasTimedOut(true), STAKE_POSITION_SYNC_WAIT_MS);
    return () => clearTimeout(timer);
  }, [opening.isStale]);

  const hasSynced = (account?.lastSyncDate.getTime() ?? 0) > opening.lastSyncTime;
  const hasFailed = Boolean(error) && error !== opening.error;
  return opening.isStale && !hasSynced && !hasFailed && !hasTimedOut;
}
