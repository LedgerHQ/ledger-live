import { useCallback, useEffect, useRef, useState } from "react";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { filter, map, throttleTime } from "rxjs/operators";
import { asyncScheduler } from "rxjs";
import {
  aleoPrivateSyncProgress$,
  getAleoSyncProgress,
} from "@ledgerhq/live-common/families/aleo/bridge";
import { PROGRESS_THROTTLE_INTERVAL_MS } from "@ledgerhq/live-common/families/aleo/constants";
import { MANDATORY_SYNC_POLLING_DELAY } from "../constants";
import { isAleoAccount } from "../modals/send/steps/utils";

interface UseAleoPrivateSyncOptions {
  account: Account | TokenAccount | null | undefined;
  /** If true, sync starts automatically on mount and cannot be stopped. */
  autoStart?: boolean;
  /** Called with the locally-computed updated account after each sync emission. */
  onAccountUpdated?: (account: Account) => void;
}

interface UseAleoPrivateSyncResult {
  isSyncing: boolean;
  progress: number;
  error: Error | null;
  start: () => void;
  stop: () => void;
  /** Non-null (0–100) when a background bridge sync is running and this hook is idle. */
  backgroundProgress: number | null;
}

export const useAleoPrivateSync = ({
  account,
  autoStart = false,
  onAccountUpdated,
}: UseAleoPrivateSyncOptions): UseAleoPrivateSyncResult => {
  const accountId = account?.type === "Account" ? account.id : undefined;

  const dispatch = useDispatch();
  // Tracks the last non-null progress so components can detect "completed at 100%"
  // vs "aborted early" even after the subject resets to null.
  const lastProgressRef = useRef(0);
  const onAccountUpdatedRef = useRef(onAccountUpdated);
  const accountRef = useRef(account);
  const isSyncingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe(): void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [aleoProgress, setAleoProgress] = useState<number | null>(() =>
    accountId ? getAleoSyncProgress(accountId) : null,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  onAccountUpdatedRef.current = onAccountUpdated;
  accountRef.current = account;
  // progress: when this hook is syncing, show subject progress (throttled 150ms) falling
  // back to the last seen value so the display stays stable between ticks.
  // backgroundProgress: non-null when a background bridge sync is running while this
  // hook is idle — same subject, different condition.
  const progress = isSyncing ? (aleoProgress ?? lastProgressRef.current) : lastProgressRef.current;
  const backgroundProgress = isSyncing ? null : aleoProgress;

  const runSync = useCallback(() => {
    const acc = accountRef.current;
    if (!isSyncingRef.current || acc?.type !== "Account" || !isAleoAccount(acc)) return;

    let latestSynced = false;
    // Tracks whether error/complete fired synchronously inside .subscribe() before it returned.
    // When the lock is held, complete() fires synchronously, setting subscriptionRef.current = null before .subscribe() returns.
    // Without this guard the outer assignment would overwrite that null with the already-closed subscription,
    // corrupting the "are we between retries?" check.
    let completedSynchronously = false;
    const bridge = getAccountBridge(acc);
    const sub = bridge.sync(acc, { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED }).subscribe({
      next: updater => {
        const currentAcc = accountRef.current;
        if (currentAcc?.type !== "Account" || !isAleoAccount(currentAcc)) return;
        dispatch(updateAccountWithUpdater(currentAcc.id, updater));
        const updatedAccount = updater(currentAcc);
        if (!isAleoAccount(updatedAccount)) return;

        latestSynced = updatedAccount.aleoResources?.provableApi?.scannerStatus?.synced ?? false;
        onAccountUpdatedRef.current?.(updatedAccount);
        if (latestSynced) {
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      },
      error: (err: Error) => {
        completedSynchronously = true;
        subscriptionRef.current = null;
        isSyncingRef.current = false;
        setIsSyncing(false);
        setError(err);
      },
      complete: () => {
        completedSynchronously = true;
        subscriptionRef.current = null;
        if (isSyncingRef.current && !latestSynced) {
          retryTimerRef.current = setTimeout(runSync, MANDATORY_SYNC_POLLING_DELAY);
        } else if (isSyncingRef.current) {
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      },
    });

    if (!completedSynchronously) {
      subscriptionRef.current = sub;
    }
  }, [dispatch]);

  const start = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setError(null);
    lastProgressRef.current = 0;
    isSyncingRef.current = true;
    setIsSyncing(true);
    runSync();
  }, [runSync]);

  const stop = useCallback(() => {
    isSyncingRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe(); // triggers observable teardown -> emitAleoSyncDone
    subscriptionRef.current = null;
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    if (!accountId) return;
    const sub = aleoPrivateSyncProgress$
      .pipe(
        filter(e => e.accountId === accountId),
        map(e => e.progress),
        throttleTime(PROGRESS_THROTTLE_INTERVAL_MS, asyncScheduler, {
          leading: true,
          trailing: true,
        }),
      )
      .subscribe(p => {
        setAleoProgress(p);
        if (p !== null) lastProgressRef.current = p;
      });

    return () => sub.unsubscribe();
  }, [accountId]);

  // Auto-start: kick off on mount; cleanup always runs on unmount.
  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      stop();
    };
  }, [autoStart, start, stop]);

  return { isSyncing, progress, error, start, stop, backgroundProgress };
};
