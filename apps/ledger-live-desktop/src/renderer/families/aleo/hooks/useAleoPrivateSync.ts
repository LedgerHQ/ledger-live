import { useCallback, useEffect, useRef, useState } from "react";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { MANDATORY_SYNC_POLLING_DELAY } from "../constants";
import { isAleoAccount } from "../modals/send/steps/utils";

interface UseAleoPrivateSyncOptions {
  account: Account | TokenAccount | null | undefined;
  /** If true, sync starts automatically on mount and cannot be stopped. */
  autoStart?: boolean;
}

interface UseAleoPrivateSyncResult {
  isSyncing: boolean;
  progress: number;
  error: Error | null;
  start: () => void;
  stop: () => void;
}

export const useAleoPrivateSync = ({
  account,
  autoStart = false,
}: UseAleoPrivateSyncOptions): UseAleoPrivateSyncResult => {
  const dispatch = useDispatch();

  const accountRef = useRef(account);
  accountRef.current = account;

  const isSyncingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe(): void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const runSync = useCallback(() => {
    const acc = accountRef.current;
    if (!isSyncingRef.current || acc?.type !== "Account" || !isAleoAccount(acc)) return;

    let latestPercentage = 0;
    const bridge = getAccountBridge(acc);
    subscriptionRef.current = bridge
      .sync(acc, { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED })
      .subscribe({
        next: updater => {
          const currentAcc = accountRef.current;
          if (currentAcc?.type !== "Account" || !isAleoAccount(currentAcc)) return;
          dispatch(updateAccountWithUpdater(currentAcc.id, updater));
          const updatedAccount = updater(currentAcc);
          if (!isAleoAccount(updatedAccount)) return;
          latestPercentage =
            updatedAccount.aleoResources?.provableApi?.scannerStatus?.percentage ?? 0;
          setProgress(latestPercentage);
        },
        error: (err: Error) => {
          subscriptionRef.current = null;
          isSyncingRef.current = false;
          setIsSyncing(false);
          setError(err);
        },
        complete: () => {
          subscriptionRef.current = null;
          if (isSyncingRef.current && latestPercentage < 100) {
            retryTimerRef.current = setTimeout(runSync, MANDATORY_SYNC_POLLING_DELAY);
          } else if (isSyncingRef.current) {
            isSyncingRef.current = false;
            setIsSyncing(false);
          }
        },
      });
  }, [dispatch]);

  const start = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setError(null);
    isSyncingRef.current = true;
    setIsSyncing(true);
    runSync();
  }, [runSync]);

  const stop = useCallback(() => {
    isSyncingRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setIsSyncing(false);
  }, []);

  // Auto-start: kick off on mount; cleanup always runs on unmount.
  useEffect(() => {
    if (autoStart) {
      isSyncingRef.current = true;
      setIsSyncing(true);
      runSync();
    }
    return () => {
      isSyncingRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [autoStart, runSync]);

  return { isSyncing, progress, error, start, stop };
};
