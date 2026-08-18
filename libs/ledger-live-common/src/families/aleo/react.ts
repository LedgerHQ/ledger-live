import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useFeature } from "@features/platform-feature-flags";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type Transport from "@ledgerhq/hw-transport";
import { asyncScheduler, from, mergeMap, throttleTime, type Observable } from "rxjs";
import type { Transaction } from "../../generated/types";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../../hw/connectApp";
import connectApp from "../../hw/connectApp";
import type { Device } from "../../hw/actions/types";
import { getAccountBridge } from "../../bridge";
import {
  createAction,
  getViewKeyExec,
  type Request,
  type ViewKeyProgress,
  type ViewKeysByAccountId,
} from "./hw/getViewKey/index";
import {
  getStrategyConfig,
  isAleoAccount,
  isAleoTransaction,
  isPrivateTransaction,
  patchAccountWithViewKey,
  sumPrivateRecords,
} from "./utils";
import type { AleoAccount, AleoTokenAccount, AleoUnspentRecord, SigningStrategy } from "./types";
import { aleoPrivateSyncProgress$ } from "./privateSyncProgress";
import { MANDATORY_SYNC_POLLING_DELAY, PROGRESS_THROTTLE_INTERVAL_MS } from "./constants";

const QUICK_AMOUNT_STRATEGIES: SigningStrategy[] = ["fast", "balanced", "full"];

interface QuickAmountStrategyTile {
  strategy: SigningStrategy;
  min: number;
  max: number;
  availableCount: number;
  rangeSum: BigNumber;
  disabled: boolean;
  selected: boolean;
  isSendMax: boolean;
}

export interface UseAleoQuickAmountSelectorResult {
  /** Narrowed from the input `AccountLike` — safe to pass to Aleo-only components. */
  account: AleoAccount | AleoTokenAccount;
  strategyData: QuickAmountStrategyTile[];
  totalSpendableBalance: BigNumber;
  selectedRecordsCount: number;
  selectStrategy: (tile: QuickAmountStrategyTile) => void;
}

function getUnspentPrivateRecords(account: AleoAccount | AleoTokenAccount): AleoUnspentRecord[] {
  return (
    (account.type === "TokenAccount"
      ? account.unspentPrivateRecords
      : account.aleoResources?.unspentPrivateRecords) ?? []
  );
}

/**
 * Derives the fast/balanced/full quick-amount tiles for an Aleo account's private records,
 * shared between the desktop and mobile QuickAmountSelector components so only rendering
 * differs. Whether the widget should be shown for the current transaction mode is up to callers.
 *
 * Only meant to be called from the Aleo send flow — throws if `account` isn't an Aleo account.
 */
export function useAleoQuickAmountSelector({
  account,
  transaction,
  updateTransaction,
}: {
  account: AccountLike;
  transaction: Transaction;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
}): UseAleoQuickAmountSelectorResult {
  const sortedRecords = useMemo(() => {
    if (!isAleoAccount(account)) return [];
    return getUnspentPrivateRecords(account)
      .filter(r => new BigNumber(r.microcredits).isGreaterThan(0))
      .sort((a, b) => new BigNumber(b.microcredits).comparedTo(a.microcredits));
  }, [account]);

  const strategyConfig = useMemo(
    () => (isAleoAccount(account) ? getStrategyConfig(account) : null),
    [account],
  );

  const totalRecords = sortedRecords.length;

  const totalSpendableBalance = useMemo(
    () =>
      strategyConfig
        ? sumPrivateRecords(sortedRecords.slice(0, strategyConfig.full.max))
        : new BigNumber(0),
    [sortedRecords, strategyConfig],
  );

  const selectedRecordsCount =
    isAleoTransaction(transaction) && isPrivateTransaction(transaction)
      ? (transaction.properties?.amountRecordCommitments.length ?? 0)
      : 0;

  const strategyData = useMemo(() => {
    if (!strategyConfig) return [];

    return QUICK_AMOUNT_STRATEGIES.map(strategy => {
      const { min, max } = strategyConfig[strategy];
      const rangeRecords = sortedRecords.slice(0, max);
      const availableCount = rangeRecords.length;
      const rangeSum = sumPrivateRecords(rangeRecords);

      const disabled = totalRecords < min;
      const coversAllRecords = availableCount === totalRecords;
      const isFullTierAtCap = max === strategyConfig.full.max && availableCount === max;
      const isSendMax = !disabled && (coversAllRecords || isFullTierAtCap);

      const matchesTierRangeSum =
        !disabled &&
        !isSendMax &&
        !rangeSum.isZero() &&
        transaction.amount.isEqualTo(rangeSum) &&
        !transaction.useAllAmount;
      const selected =
        !disabled && (isSendMax ? transaction.useAllAmount === true : matchesTierRangeSum);

      return {
        strategy,
        min,
        max,
        availableCount,
        rangeSum,
        disabled,
        selected,
        isSendMax,
      };
    });
  }, [sortedRecords, totalRecords, transaction.amount, transaction.useAllAmount, strategyConfig]);

  const selectStrategy = useCallback(
    (tile: QuickAmountStrategyTile) => {
      if (tile.disabled) return;
      if (tile.isSendMax) {
        updateTransaction(tx => ({
          ...tx,
          useAllAmount: true,
          amount: new BigNumber(0),
        }));
      } else {
        updateTransaction(tx => ({
          ...tx,
          amount: tile.rangeSum,
          useAllAmount: false,
        }));
      }
    },
    [updateTransaction],
  );

  invariant(
    isAleoAccount(account),
    "aleo: useAleoQuickAmountSelector called with a non-Aleo account",
  );

  return {
    account,
    strategyData,
    totalSpendableBalance,
    selectedRecordsCount,
    selectStrategy,
  };
}

type ConnectAppExec = (input: ConnectAppInput) => Observable<ConnectAppEvent>;
type GetViewKeyExec = (transport: Transport, request: Request) => Observable<ViewKeyProgress>;

interface UseAleoViewKeyApprovalParams {
  device: Device | null | undefined;
  selectedAccounts: Account[];
  currency: CryptoCurrency;
  connectAppExec?: ConnectAppExec;
  viewKeyExec?: GetViewKeyExec;
}

export function useAleoViewKeyApproval({
  device,
  selectedAccounts,
  currency,
  connectAppExec,
  viewKeyExec,
}: UseAleoViewKeyApprovalParams) {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;

  const action = useMemo(
    () =>
      createAction(
        connectAppExec ?? connectApp({ isLdmkConnectAppEnabled }),
        viewKeyExec ?? getViewKeyExec,
      ),
    [isLdmkConnectAppEnabled, connectAppExec, viewKeyExec],
  );

  const request = useMemo<Request>(
    () => ({ appName: "Aleo", selectedAccounts, currency }),
    [selectedAccounts, currency],
  );

  const hookState = action.useHook(device, request);
  const payload = action.mapResult(hookState);

  const { confirmedAccountIds, rejectedAccountIds } = useMemo(() => {
    const confirmed = new Set<string>();
    const rejected = new Set<string>();
    Object.entries(hookState.shareProgress.viewKeys).forEach(([accountId, viewKey]) => {
      if (viewKey === null) {
        rejected.add(accountId);
      } else {
        confirmed.add(accountId);
      }
    });
    return { confirmedAccountIds: confirmed, rejectedAccountIds: rejected };
  }, [hookState.shareProgress.viewKeys]);

  return { hookState, payload, request, confirmedAccountIds, rejectedAccountIds };
}

export function buildAccountsWithViewKeys(
  accounts: Account[],
  viewKeysByAccountId: NonNullable<ViewKeysByAccountId>,
): Account[] {
  return accounts.reduce<Account[]>((acc, account) => {
    const viewKey = viewKeysByAccountId[account.id];
    if (!viewKey) return acc;
    acc.push(patchAccountWithViewKey(account, viewKey));
    return acc;
  }, []);
}

/**
 * Module-level registry that keeps track of sync subscriptions that should
 * survive component unmount (when keepAliveOnUnmount is true).
 *
 * Keyed by accountId so any remounting hook instance can adopt the running sync
 * instead of starting a duplicate.
 */
interface KeepAliveEntry {
  isSyncing: boolean;
  progress: number;
  /** The underlying RxJS subscription — held here so stop() can cancel it even
   *  after the originating component has unmounted. */
  sub: { unsubscribe(): void } | null;
  /** Unsubscribes from the Redux store watcher that detects account deletion. */
  storeUnsubscribe: (() => void) | null;
}

const keepAliveRegistry = new Map<string, KeepAliveEntry>();

interface UseAleoPrivateSyncOptions {
  account: Account | null | undefined;
  /** If true, sync starts automatically on mount. */
  autoStart?: boolean;
  /** Called with the locally-computed updated account after each sync emission. */
  onAccountUpdated?: (account: Account) => void;
  /**
   * If true the sync subscription is NOT cancelled when the component unmounts.
   * The sync continues in the background, dispatching results to Redux. When the
   * component remounts it automatically adopts the running sync from the registry.
   */
  keepAliveOnUnmount?: boolean;
  /** Platform-specific account-by-id selector (each app's accounts slice is shaped differently). */
  accountSelector: (state: unknown, params: { accountId: string }) => Account | undefined;
  /** Platform-specific action creator for patching an account in the app's Redux store. */
  updateAccountWithUpdater: (
    accountId: string,
    updater: (account: Account) => Account,
  ) => { type: string; payload: unknown };
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
  keepAliveOnUnmount = false,
  accountSelector,
  updateAccountWithUpdater,
}: UseAleoPrivateSyncOptions): UseAleoPrivateSyncResult => {
  const dispatch = useDispatch();
  const store = useStore();

  const accountId = account?.type === "Account" ? account.id : undefined;
  const liveAccount = useSelector(state =>
    accountId ? accountSelector(state, { accountId }) : undefined,
  );

  const onAccountUpdatedRef = useRef(onAccountUpdated);
  onAccountUpdatedRef.current = onAccountUpdated;

  // accountSelector/updateAccountWithUpdater are typically recreated on every
  // render by the platform-specific wrapper hook — keep them in refs so their
  // identity doesn't cascade into the useCallback/useEffect dependency arrays
  // below and cause the sync subscription to be torn down and restarted.
  const accountSelectorRef = useRef(accountSelector);
  accountSelectorRef.current = accountSelector;

  const updateAccountWithUpdaterRef = useRef(updateAccountWithUpdater);
  updateAccountWithUpdaterRef.current = updateAccountWithUpdater;

  const accountRef = useRef(account);
  accountRef.current = account;

  const liveAccountRef = useRef(liveAccount);
  liveAccountRef.current = liveAccount;

  // Read registry once on mount so a remounting hook adopts the running sync.
  const keepAliveEntry =
    keepAliveOnUnmount && accountId ? keepAliveRegistry.get(accountId) : undefined;

  const keepAliveOnUnmountRef = useRef(keepAliveOnUnmount);
  keepAliveOnUnmountRef.current = keepAliveOnUnmount;

  const isSyncingRef = useRef(keepAliveEntry?.isSyncing ?? false);
  const subscriptionRef = useRef<{ unsubscribe(): void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set when we adopt an external completion so the liveAccount effect can
  // call onAccountUpdated once Redux has caught up with the dispatch.
  const pendingExternalCompletionRef = useRef(false);
  // Tracks whether the component is currently mounted. Used to skip React
  // state updates and callbacks when the subscription fires after unmount
  // (only relevant for keepAliveOnUnmount=true, where the RxJS subscription
  // outlives the component).
  const isMountedRef = useRef(true);

  const [isSyncing, setIsSyncing] = useState(keepAliveEntry?.isSyncing ?? false);
  const [progress, setProgress] = useState(keepAliveEntry?.progress ?? 0);
  const [error, setError] = useState<Error | null>(null);

  const runSync = useCallback(() => {
    const acc = accountRef.current;
    if (!isSyncingRef.current || acc?.type !== "Account" || !isAleoAccount(acc)) return;

    const currentAccountId = acc.id;
    let receivedFinalResult = false;
    const sub = from(Promise.resolve(getAccountBridge(acc)))
      .pipe(
        mergeMap(bridge =>
          bridge.sync(acc, { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED }),
        ),
      )
      .subscribe({
        next: updater => {
          const currentAcc = accountRef.current;
          if (currentAcc?.type !== "Account" || !isAleoAccount(currentAcc)) return;
          dispatch(updateAccountWithUpdaterRef.current(currentAcc.id, updater));
          const updatedAccount = updater(currentAcc);
          if (!isAleoAccount(updatedAccount)) return;
          receivedFinalResult = true;
          if (keepAliveOnUnmountRef.current) {
            const entry = keepAliveRegistry.get(currentAccountId);
            entry?.storeUnsubscribe?.();
            keepAliveRegistry.delete(currentAccountId);
          }
          onAccountUpdatedRef.current?.(updatedAccount);
          isSyncingRef.current = false;
          if (isMountedRef.current) {
            setIsSyncing(false);
            setProgress(100);
          }
        },
        error: (err: Error) => {
          subscriptionRef.current = null;
          if (keepAliveOnUnmountRef.current) {
            const entry = keepAliveRegistry.get(currentAccountId);
            entry?.storeUnsubscribe?.();
            keepAliveRegistry.delete(currentAccountId);
          }
          isSyncingRef.current = false;
          if (isMountedRef.current) {
            setIsSyncing(false);
            setError(err);
          }
        },
        complete: () => {
          subscriptionRef.current = null;
          if (isSyncingRef.current && !receivedFinalResult) {
            retryTimerRef.current = setTimeout(runSync, MANDATORY_SYNC_POLLING_DELAY);
          } else if (isSyncingRef.current) {
            if (keepAliveOnUnmountRef.current) {
              const entry = keepAliveRegistry.get(currentAccountId);
              entry?.storeUnsubscribe?.();
              keepAliveRegistry.delete(currentAccountId);
            }
            isSyncingRef.current = false;
            if (isMountedRef.current) {
              setIsSyncing(false);
            }
          }
        },
      });
    if (!sub.closed) {
      subscriptionRef.current = sub;
      // Store the live subscription in the registry so stop() can cancel it
      // even after this component instance has unmounted.
      if (keepAliveOnUnmountRef.current) {
        const entry = keepAliveRegistry.get(currentAccountId);
        if (entry) entry.sub = sub;
      }
    }
  }, [dispatch]);

  const start = useCallback(() => {
    const acc = accountRef.current;
    if (acc?.type !== "Account" || !isAleoAccount(acc)) return;

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setError(null);
    setProgress(0);
    isSyncingRef.current = true;
    setIsSyncing(true);
    if (keepAliveOnUnmountRef.current) {
      const id = acc.id;
      // Cancel and detach any keep-alive sync already registered for this
      // account (e.g. a re-entrant start() call) before replacing it, so we
      // never leak a running subscription or store watcher.
      const existingEntry = keepAliveRegistry.get(id);
      existingEntry?.sub?.unsubscribe();
      existingEntry?.storeUnsubscribe?.();
      // Subscribe to the Redux store so we can cancel the sync if the account
      // is deleted while the component is unmounted.
      const storeUnsubscribe = store.subscribe(() => {
        const found = accountSelectorRef.current(store.getState(), { accountId: id });
        if (!found) {
          const entry = keepAliveRegistry.get(id);
          if (entry) {
            entry.sub?.unsubscribe();
            entry.storeUnsubscribe?.();
            keepAliveRegistry.delete(id);
          }
        }
      });
      keepAliveRegistry.set(id, { isSyncing: true, progress: 0, sub: null, storeUnsubscribe });
    }
    runSync();
  }, [runSync, store]);

  const stop = useCallback(() => {
    isSyncingRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    // Also cancel and remove any keep-alive subscription for this account
    if (keepAliveOnUnmountRef.current) {
      const id = accountRef.current?.type === "Account" ? accountRef.current.id : undefined;
      if (id) {
        const entry = keepAliveRegistry.get(id);
        entry?.sub?.unsubscribe();
        entry?.storeUnsubscribe?.();
        keepAliveRegistry.delete(id);
      }
    }
    if (isMountedRef.current) {
      setIsSyncing(false);
    }
  }, []);

  // Track component mount state so subscription handlers can skip React state
  // updates after unmount (keepAliveOnUnmount keeps the RxJS sub alive).
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-start: kick off on mount; cleanup always runs on unmount.
  useEffect(() => {
    if (autoStart) {
      const registryEntry =
        keepAliveOnUnmount && accountId ? keepAliveRegistry.get(accountId) : undefined;
      if (registryEntry?.isSyncing) {
        // Adopt the already-running keep-alive sync: just observe via
        // aleoPrivateSyncProgress$ — no new subscription needed.
        isSyncingRef.current = true;
        setIsSyncing(true);
        setProgress(registryEntry.progress);
      } else {
        start();
      }
    }
    return () => {
      if (!keepAliveOnUnmount) stop();
      // When keepAliveOnUnmount is true we intentionally leave the subscription
      // alive so the sync can complete in the background.
    };
  }, [autoStart, keepAliveOnUnmount, accountId, start, stop]);

  // Subscribe to progress events emitted by the sync observable via the subject.
  useEffect(() => {
    if (!accountId) return;
    const sub = aleoPrivateSyncProgress$
      .pipe(
        throttleTime(PROGRESS_THROTTLE_INTERVAL_MS, asyncScheduler, {
          leading: true,
          trailing: true,
        }),
      )
      .subscribe(event => {
        if (event.accountId !== accountId || !isSyncingRef.current || event.progress === null)
          return;
        const progress = event.progress;
        setProgress(prev => Math.max(prev, progress));
        // Keep registry progress current so a remounting component adopts accurate state.
        if (keepAliveOnUnmountRef.current) {
          const entry = keepAliveRegistry.get(accountId);
          if (entry) entry.progress = Math.max(entry.progress, progress);
        }
        // Another hook instance completed the full sync while we were blocked/retrying.
        // Adopt it as done so we don't fire a redundant second sync.
        if (event.progress >= 100 && subscriptionRef.current === null) {
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          isSyncingRef.current = false;
          setIsSyncing(false);
          if (keepAliveOnUnmountRef.current) {
            const entry = keepAliveRegistry.get(accountId);
            entry?.storeUnsubscribe?.();
            keepAliveRegistry.delete(accountId);
          }
          // By the time this throttled event arrives Redux has already been
          // updated by the keepAlive instance. Read the ref directly so we
          // don't depend on a liveAccount re-render that has already fired.
          const currentLiveAccount = liveAccountRef.current;
          if (
            currentLiveAccount &&
            isAleoAccount(currentLiveAccount) &&
            currentLiveAccount.aleoResources?.lastPrivateSyncDate
          ) {
            onAccountUpdatedRef.current?.(currentLiveAccount);
          } else {
            // Rare: Redux hasn't flushed yet — fall back to the liveAccount effect.
            pendingExternalCompletionRef.current = true;
          }
        }
      });
    return () => sub.unsubscribe();
  }, [accountId]);

  // Once Redux reflects the externally-completed sync, propagate the fresh
  // account to the caller (e.g. the modal's updateAccount).
  useEffect(() => {
    if (!pendingExternalCompletionRef.current) return;
    if (!liveAccount || !isAleoAccount(liveAccount)) return;
    if (!liveAccount.aleoResources?.lastPrivateSyncDate) return;
    pendingExternalCompletionRef.current = false;
    onAccountUpdatedRef.current?.(liveAccount);
  }, [liveAccount]);

  return { isSyncing, progress, error, start, stop };
};
