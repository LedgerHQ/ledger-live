import { useCallback, useEffect, useRef, useState } from "react";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { accountSelector } from "~/renderer/reducers/accounts";
import type { State } from "~/renderer/reducers";
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
}

export const useAleoPrivateSync = ({
  account,
  autoStart = false,
  onAccountUpdated,
}: UseAleoPrivateSyncOptions): UseAleoPrivateSyncResult => {
  const dispatch = useDispatch();

  const accountId = account?.type === "Account" ? account.id : undefined;
  const liveAccount = useSelector((state: State) =>
    accountId ? accountSelector(state, { accountId }) : undefined,
  );

  const onAccountUpdatedRef = useRef(onAccountUpdated);
  onAccountUpdatedRef.current = onAccountUpdated;

  const accountRef = useRef(account);
  accountRef.current = account;

  const isSyncingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe(): void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set to true the first time we observe a non-null privateSyncProgress from
  // the Redux store while we are in the retry-wait state (i.e. blocked by
  // another sync holding the lock).  Used to distinguish a real background
  // private-sync finish from an unrelated account update where
  // privateSyncProgress is null by default.
  const seenBackgroundSyncRef = useRef(false);
  // Captures the lastPrivateSyncDate at the moment our sync starts so we can
  // detect when the background sync has completed a full private sync for us.
  const initialLastPrivateSyncDateRef = useRef<Date | null | undefined>(undefined);

  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const runSync = useCallback(() => {
    const acc = accountRef.current;
    if (!isSyncingRef.current || acc?.type !== "Account" || !isAleoAccount(acc)) return;

    let latestPercentage = 0;
    let latestSynced = false;
    const bridge = getAccountBridge(acc);
    const sub = bridge.sync(acc, { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED }).subscribe({
      next: updater => {
        const currentAcc = accountRef.current;
        if (currentAcc?.type !== "Account" || !isAleoAccount(currentAcc)) return;
        dispatch(updateAccountWithUpdater(currentAcc.id, updater));
        const updatedAccount = updater(currentAcc);
        if (!isAleoAccount(updatedAccount)) return;
        latestPercentage =
          updatedAccount.aleoResources?.privateSyncProgress ??
          updatedAccount.aleoResources?.provableApi?.scannerStatus?.percentage ??
          0;

        const isFinalResult = updatedAccount.aleoResources?.privateSyncProgress == null;
        latestSynced = isFinalResult
          ? updatedAccount.aleoResources?.provableApi?.scannerStatus?.synced ?? false
          : false;
        setProgress(latestPercentage);
        onAccountUpdatedRef.current?.(updatedAccount);
        // Scanner is done — mark syncing complete immediately so the
        // component can react without waiting for the observable to complete.
        if (latestSynced) {
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      },
      error: (err: Error) => {
        subscriptionRef.current = null;
        isSyncingRef.current = false;
        setIsSyncing(false);
        setError(err);
      },
      complete: () => {
        subscriptionRef.current = null;
        if (isSyncingRef.current && !latestSynced) {
          retryTimerRef.current = setTimeout(runSync, MANDATORY_SYNC_POLLING_DELAY);
        } else if (isSyncingRef.current) {
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      },
    });
    // Guard against the synchronous-completion race: when the lock is held,
    // subscriber.complete() fires synchronously inside .subscribe(), which
    // sets subscriptionRef.current = null before .subscribe() returns.
    // Without this guard the outer assignment would overwrite that null with
    // the already-closed subscription, breaking the "are we between retries?"
    // check used in the liveAccount effect below.
    if (!sub.closed) {
      subscriptionRef.current = sub;
    }
  }, [dispatch]);

  const start = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setError(null);
    setProgress(0);
    seenBackgroundSyncRef.current = false;
    const acc = accountRef.current;
    initialLastPrivateSyncDateRef.current =
      acc?.type === "Account" && isAleoAccount(acc)
        ? acc.aleoResources?.lastPrivateSyncDate
        : undefined;
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

    const acc = accountRef.current;
    if (
      acc?.type === "Account" &&
      isAleoAccount(acc) &&
      acc.aleoResources?.privateSyncProgress != null
    ) {
      dispatch(
        updateAccountWithUpdater(acc.id, (a: Account) => {
          if (!isAleoAccount(a) || !a.aleoResources) return a;
          return { ...a, aleoResources: { ...a.aleoResources, privateSyncProgress: null } };
        }),
      );
    }
  }, [dispatch]);

  // Auto-start: kick off on mount; cleanup always runs on unmount.
  useEffect(() => {
    if (autoStart) {
      seenBackgroundSyncRef.current = false;
      const acc = accountRef.current;
      initialLastPrivateSyncDateRef.current =
        acc?.type === "Account" && isAleoAccount(acc)
          ? acc.aleoResources?.lastPrivateSyncDate
          : undefined;
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

  // When this hook's own sync attempt is blocked (another sync holds the lock),
  // the observable completes immediately with no emissions and the hook waits
  // MANDATORY_SYNC_POLLING_DELAY before retrying. During that wait the account
  // in the Redux store IS being updated with privateSyncProgress by the running
  // background sync. Mirror those updates into the local progress state and, when
  // the background sync finishes (privateSyncProgress becomes null), cancel the
  // pending retry timer and schedule an immediate retry so there is no
  // unnecessary extra wait.
  useEffect(() => {
    // Only act when we're syncing but our own observable is not active —
    // i.e. we are between retries (blocked or waiting to retry).
    if (!isSyncing || subscriptionRef.current !== null) return;

    const live = liveAccount;
    if (!live || !isAleoAccount(live)) return;

    const bgProgress = live.aleoResources?.privateSyncProgress;
    if (bgProgress != null) {
      // Background private sync is in progress — mirror its progress.
      seenBackgroundSyncRef.current = true;
      setProgress(bgProgress);
    } else if (seenBackgroundSyncRef.current) {
      // Background sync just finished (we saw non-null progress before).
      seenBackgroundSyncRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      // If the background sync updated lastPrivateSyncDate it means it ran a
      // full private sync that covers what we needed. Mark ourselves done so
      // the step can transition instead of starting a redundant second sync.
      const currentLastPrivateSyncDate = live.aleoResources?.lastPrivateSyncDate;
      const initialDate = initialLastPrivateSyncDateRef.current;
      const backgroundSyncCompletedOurWork =
        currentLastPrivateSyncDate != null &&
        (initialDate == null || currentLastPrivateSyncDate > initialDate);

      if (backgroundSyncCompletedOurWork) {
        // Push the fresh account (with updated records/balance) into the
        // modal's local state so downstream steps don't see stale data.
        onAccountUpdatedRef.current?.(live);
        isSyncingRef.current = false;
        setProgress(100);
        setIsSyncing(false);
      } else {
        // Background sync ran but didn't complete a full private sync (e.g. it
        // was a public-only sync that happened to emit progress). Retry.
        retryTimerRef.current = setTimeout(runSync, 200);
      }
    }
  }, [liveAccount, isSyncing, runSync]);

  return { isSyncing, progress, error, start, stop };
};
