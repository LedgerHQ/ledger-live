import { log } from "@ledgerhq/logs";
import shuffle from "lodash/shuffle";
import priorityQueue from "async/priorityQueue";
import asyncQueue from "async/queue";
import { Observable, concat, from } from "rxjs";
import { ignoreElements, reduce } from "rxjs/operators";
import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { getVotesCount, isUpToDateAccount } from "../../account";
import { getAccountBridge } from "..";
import { getAccountCurrency } from "../../account";
import { getEnv } from "@ledgerhq/live-env";
import type {
  SyncAction,
  SyncState,
  BridgeSyncState,
  UnimportedAccountDescriptors,
  WalletSyncPayload,
  WalletSyncInferredActions,
  UpdatesQueue,
  UpdatesInput,
} from "./types";
import { BridgeSyncContext, BridgeSyncStateContext } from "./context";
import type { Account, SubAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { VersionManager, useWalletSync } from "./useWalletSync";
import { accountDataToAccount } from "../../cross";
import { promiseAllBatched } from "@ledgerhq/live-promise";

export type Props = {
  // this is a wrapping component that you need to put in your tree
  children: React.ReactNode;
  // you need to inject the accounts to sync on
  accounts: Account[];
  // provide a way to save the result of an account sync update
  updateAccountWithUpdater: (accountId: string, updater: (arg0: Account) => Account) => void;

  // handles an error / log / do action with it
  // if the function returns falsy, the sync will ignore error, otherwise it's treated as error with the error you return (likely the same)
  recoverError: (arg0: Error) => Error | null | undefined | void;
  // track sync lifecycle for analytics
  trackAnalytics: (arg0: string, arg1?: Record<string, any> | null, mandatory?: boolean) => void;
  // load all data needed for a currency (it's calling currencyBridge prepare mechanism)
  prepareCurrency: (currency: CryptoCurrency) => Promise<any>;
  // provide an implementation of hydrate (it preload from a local storage impl the data cached from a previous prepare)
  hydrateCurrency: (currency: CryptoCurrency) => Promise<any>;
  // an array of token ids to blacklist from the account sync
  blacklistedTokenIds?: string[];

  // credentials for 'Wallet Sync'. if defined, it will enable the sync of accounts from a remote server
  walletSyncAuth?: string;

  // FIXME: these new introduced fields specific to Wallet Sync needs are all going to be actions/lenses with our redux store, so at the end, it could make more sense to somehow access the store directly and put the store (actions,reducers) on live-common too
  // FIXME: this would also help the need to go "atomic": we want to update Accounts+Version+WalletSyncPayload altogether in one time. right now it's not possible because things are "decoupled", but it's important for atomicity

  // more global way to update all accounts at once
  updateAllAccounts: (updater: (previousAccounts: Account[]) => Account[]) => void;
  walletSyncVersionManager: VersionManager;
  setLatestWalletSyncPayload: (replace: WalletSyncPayload) => void;
  getLatestWalletSyncPayload: () => WalletSyncPayload | undefined;
};

type SyncJob = {
  accountId: string;
  reason: string;
};

export const BridgeSync = ({
  children,
  accounts,
  updateAccountWithUpdater,
  updateAllAccounts,
  recoverError,
  trackAnalytics,
  prepareCurrency,
  hydrateCurrency,
  blacklistedTokenIds,
  walletSyncAuth,
  walletSyncVersionManager,
  setLatestWalletSyncPayload,
  getLatestWalletSyncPayload,
}: Props): JSX.Element => {
  useHydrate({
    accounts,
    hydrateCurrency,
  });
  const [syncQueue, syncState] = useSyncQueue({
    accounts,
    prepareCurrency,
    recoverError,
    trackAnalytics,
    updateAccountWithUpdater,
    blacklistedTokenIds,
  });
  const updatesQueue = useUpdatesQueue({
    accounts,
    blacklistedTokenIds,
    prepareCurrency,
    updateAllAccounts,
  });
  const sync = useSync({
    syncQueue,
    accounts,
    updatesQueue,
  });
  useSyncBackground({
    sync,
  });
  useSyncContinouslyPendingOperations({
    sync,
    accounts,
  });
  useWalletSync({
    accounts,
    sync,
    walletSyncAuth,
    walletSyncVersionManager,
    getLatestWalletSyncPayload,
    setLatestWalletSyncPayload,
    updatesQueue,
  });

  return (
    <BridgeSyncStateContext.Provider value={syncState}>
      <BridgeSyncContext.Provider value={sync}>{children}</BridgeSyncContext.Provider>
    </BridgeSyncStateContext.Provider>
  );
};

// utility internal hooks for <BridgeSync>
// useHydrate: bridge.hydrate once for each currency
function useHydrate({ accounts, hydrateCurrency }) {
  const hydratedCurrencies = useRef({});
  useEffect(() => {
    const hydrated = hydratedCurrencies.current;

    for (const account of accounts) {
      const { currency } = account;

      if (!hydrated[currency.id]) {
        hydrated[currency.id] = true;
        hydrateCurrency(currency);
      }
    }
  }, [accounts, hydrateCurrency]);
}

const lastTimeAnalyticsTrackPerAccountId: Record<string, number> = {};
const lastTimeSuccessSyncPerAccountId: Record<string, number> = {};
const nothingState = {
  pending: false,
  error: null,
};

// implement the core logic of synchronisation of an account used by both the sync queue and the wallet sync logic
function syncAccountCore(
  account: Account,
  {
    blacklistedTokenIds,
    prepareCurrency,
  }: {
    blacklistedTokenIds?: string[];
    prepareCurrency: (currency: CryptoCurrency) => Promise<void>;
  },
): Observable<(Account) => Account> {
  const bridge = getAccountBridge(account);

  const syncConfig = {
    paginationConfig: {},
    blacklistedTokenIds,
  };
  return concat(
    from(prepareCurrency(account.currency)).pipe(ignoreElements()),
    bridge.sync(account, syncConfig),
  );
}

// useHydrate: returns a sync queue and bridge sync state
function useSyncQueue({
  accounts,
  prepareCurrency,
  recoverError,
  trackAnalytics,
  updateAccountWithUpdater,
  blacklistedTokenIds,
}) {
  const [bridgeSyncState, setBridgeSyncState]: [BridgeSyncState, any] = useState({});
  const setAccountSyncState = useCallback((accountId: string, s: SyncState) => {
    setBridgeSyncState(state => ({ ...state, [accountId]: s }));
  }, []);
  const synchronize = useCallback(
    ({ accountId, reason }: SyncJob, next: () => void) => {
      const state = bridgeSyncState[accountId] || nothingState;

      if (state.pending) {
        next();
        return;
      }

      const account = accounts.find(a => a.id === accountId);

      if (!account) {
        next();
        return;
      }

      // FIXME if we want to stop syncs for specific currency (e.g. api down) we would do it here
      try {
        setAccountSyncState(accountId, {
          pending: true,
          error: null,
        });
        const startSyncTime = Date.now();
        const trackedRecently =
          lastTimeAnalyticsTrackPerAccountId[accountId] &&
          startSyncTime - lastTimeAnalyticsTrackPerAccountId[accountId] < 90 * 1000;

        if (!trackedRecently) {
          lastTimeAnalyticsTrackPerAccountId[accountId] = startSyncTime;
        }

        const trackSyncSuccessEnd = () => {
          if (trackedRecently) return;
          const account = accounts.find(a => a.id === accountId);
          if (!account) return;
          const subAccounts: SubAccount[] = account.subAccounts || [];

          // Nb Only emit SyncSuccess/SyncSuccessToken event once per launch
          if (lastTimeSuccessSyncPerAccountId[accountId]) {
            return;
          }
          lastTimeSuccessSyncPerAccountId[accountId] = startSyncTime;

          trackAnalytics("SyncSuccess", {
            duration: (Date.now() - startSyncTime) / 1000,
            currencyName: account.currency.name,
            derivationMode: account.derivationMode,
            freshAddressPath: account.freshAddressPath,
            operationsLength: account.operationsCount,
            accountsCountForCurrency: accounts.filter(a => a.currency === account.currency).length,
            tokensLength: subAccounts.length,
            votesCount: getVotesCount(account),
            reason,
          });

          subAccounts.forEach(a => {
            const tokenId =
              a.type === "TokenAccount" ? getAccountCurrency(a).id : account.currency.name;
            trackAnalytics("SyncSuccessToken", {
              tokenId,
              tokenTicker: getAccountCurrency(a).ticker,
              operationsLength: a.operationsCount,
              parentCurrencyName: account.currency.name,
              parentDerivationMode: account.derivationMode,
              votesCount: getVotesCount(a, account),
              reason,
            });
          });
        };

        syncAccountCore(account, {
          blacklistedTokenIds,
          prepareCurrency,
        }).subscribe({
          next: accountUpdater => {
            updateAccountWithUpdater(accountId, accountUpdater);
          },
          complete: () => {
            trackSyncSuccessEnd();
            setAccountSyncState(accountId, {
              pending: false,
              error: null,
            });
            next();
          },
          error: (raw: Error) => {
            const error = recoverError(raw);

            if (!error) {
              // This error is normal because the thread was recently killed. we silent it for the user.
              setAccountSyncState(accountId, {
                pending: false,
                error: null,
              });
              next();
              return;
            }

            setAccountSyncState(accountId, {
              pending: false,
              error,
            });
            next();
          },
        });
      } catch (error: any) {
        setAccountSyncState(accountId, {
          pending: false,
          error,
        });
        next();
      }
    },
    [
      accounts,
      bridgeSyncState,
      prepareCurrency,
      recoverError,
      setAccountSyncState,
      trackAnalytics,
      updateAccountWithUpdater,
      blacklistedTokenIds,
    ],
  );
  const synchronizeRef = useRef(synchronize);
  useEffect(() => {
    synchronizeRef.current = synchronize;
  }, [synchronize]);
  const [syncQueue] = useState(() =>
    priorityQueue(
      (job: SyncJob, next: () => void) => synchronizeRef.current(job, next),
      getEnv("SYNC_MAX_CONCURRENT"),
    ),
  );
  return [syncQueue, bridgeSyncState];
}

function asyncQueuePromise<P>(f: (payload: P) => Promise<void>) {
  return asyncQueue((payload: P, callback) => {
    f(payload).then(
      () => callback(),
      e => (console.error(e), callback()),
    );
  });
}

/**
 * yield a queue that can manage generic updates
 * by using `queue.push({ actions, onSuccess })`
 * you schedule job that will treat this new update.
 * it will do one handling at a time to secure from race condition. queue.idle() can be checked to assess if it's running or not.
 * TODO: cleanup opportunity: TBD if we want to integrate the regular "sync" in this more generic model as being a 4rd "sync" action => BENEFIT: we could update all account at once instead of one after the other which is heavy for UI?
 */
function useUpdatesQueue({
  accounts,
  // these params below must NOT change of reference too often
  blacklistedTokenIds,
  prepareCurrency,
  updateAllAccounts,
}): UpdatesQueue {
  // we use a ref for accounts to be allow to change without the need to recreate a new queue each time!
  const accountsRef = useRef(accounts);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  // we memoize a queue that will implement the WalletSync reconciliation logic
  return useMemo(
    () =>
      asyncQueuePromise<UpdatesInput>(async payload => {
        // determine all updates (some of these jobs are determined async)

        const accountIdsToRemove: string[] = payload.actions.removedAccounts.map(a => a.id);
        const accountUpdaters: Record<string, (arg0: Account) => Account> = {};

        for (const descriptor of payload.actions.updatedAccounts) {
          // account was likely renamed. propagate the renaming
          accountUpdaters[descriptor.id] = account => ({
            ...account,
            name: descriptor.name,
          });
        }

        const unimportedAccountDescriptors: UnimportedAccountDescriptors = [];

        const newAccounts = withoutUndefineds(
          await promiseAllBatched(
            getEnv("SYNC_MAX_CONCURRENT"),
            payload.actions.addedAccounts,
            async descriptor => {
              // this is a new account. we try to import it now.

              try {
                const newAccountInitialData = accountDataToAccount(descriptor);
                const account = await syncAccountCore(newAccountInitialData, {
                  blacklistedTokenIds,
                  prepareCurrency,
                })
                  .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), newAccountInitialData))
                  .toPromise();
                return account;
              } catch (error) {
                // there may be error at the attempt to import it. in that case it falls into error and we will need to remember this account.
                unimportedAccountDescriptors.push({
                  error: String((error as Error | undefined)?.name || error || ""),
                  descriptor,
                });
              }
            },
          ),
        );

        // Apply the updates

        if (unimportedAccountDescriptors.length) {
          log("bridgesync", "account synchronisation failures", {
            unimportedAccountDescriptors,
          });
        }

        updateAllAccounts(accounts => {
          const newAccountsDedup: Account[] = newAccounts.filter(
            a => !accounts.some(a2 => a2.id === a.id),
          );

          let summary = "<=accounts: ";
          if (newAccountsDedup.length) {
            summary += "+" + newAccountsDedup.length + " ";
          }
          if (accountIdsToRemove.length) {
            summary += "-" + accountIdsToRemove.length + " ";
          }
          if (payload.actions.updatedAccounts.length) {
            summary += "~" + payload.actions.updatedAccounts.length + " ";
          }
          log("bridgesync", summary);

          return (
            accounts
              // append new accounts
              .concat(newAccountsDedup)
              // apply possible updates (e.g. renaming of the account)
              .map(acc => {
                let a: Account = acc;
                if (accountUpdaters[a.id]) {
                  a = accountUpdaters[a.id](a);
                }
                return a;
              })
              // filter out accounts that were deleted
              .filter(a => !accountIdsToRemove.includes(a.id))
          );
        });

        payload.onSuccess(unimportedAccountDescriptors);
      }),
    [blacklistedTokenIds, prepareCurrency, updateAllAccounts],
  );
}

// useSync: returns a sync function with the syncQueue
function useSync({ syncQueue, accounts, updatesQueue }) {
  const skipUnderPriority = useRef(-1);
  const sync = useMemo(() => {
    const schedule = (ids: string[], priority: number, reason: string) => {
      if (priority < skipUnderPriority.current) return;
      // by convention we remove concurrent tasks with same priority
      // FIXME this is somehow a hack. ideally we should just dedup the account ids in the pending queue...
      syncQueue.remove(o => priority === o.priority);
      log("bridge", "schedule " + ids.join(", "));
      syncQueue.push(
        ids.map(accountId => ({
          accountId,
          reason,
        })),
        -priority,
      );
    };

    // don't always sync in the same order to avoid potential "account never reached"
    const shuffledAccountIds = () => shuffle(accounts.map(a => a.id));

    const handlers = {
      BACKGROUND_TICK: ({ reason }: { reason: string }) => {
        if (syncQueue.idle()) {
          schedule(shuffledAccountIds(), -1, reason);
        }
      },
      SET_SKIP_UNDER_PRIORITY: ({ priority }: { priority: number }) => {
        if (priority === skipUnderPriority.current) return;
        skipUnderPriority.current = priority;
        syncQueue.remove(({ priority }) => priority < skipUnderPriority);

        if (priority === -1 && !accounts.every(isUpToDateAccount)) {
          // going back to -1 priority => retriggering a background sync if it is "Paused"
          schedule(shuffledAccountIds(), -1, "outdated");
        }
      },
      SYNC_ALL_ACCOUNTS: ({ priority, reason }: { priority: number; reason: string }) => {
        schedule(shuffledAccountIds(), priority, reason);
      },
      SYNC_ONE_ACCOUNT: ({
        accountId,
        priority,
        reason,
      }: {
        accountId: string;
        priority: number;
        reason: string;
      }) => {
        schedule([accountId], priority, reason);
      },
      SYNC_SOME_ACCOUNTS: ({
        accountIds,
        priority,
        reason,
      }: {
        accountIds: string[];
        priority: number;
        reason: string;
      }) => {
        schedule(accountIds, priority, reason);
      },
      SYNC_WITH_WALLET_SYNC: async (payload: {
        actions: WalletSyncInferredActions;
        onSuccess: (_: UnimportedAccountDescriptors) => void;
      }) => {
        // we need to reconciliate the accounts from the metadata with the accounts from the store
        // push this in a queue to avoid concurrent usage
        updatesQueue.push(payload);
      },
    };
    return (action: SyncAction) => {
      const handler = handlers[action.type];

      if (handler) {
        log("bridge", `action ${action.type}`, {
          action,
          type: "syncQueue",
        });
        handler(action as any);
      } else {
        log("warn", "BridgeSyncContext unsupported action", {
          action,
          type: "syncQueue",
        });
      }
    };
  }, [accounts, syncQueue, updatesQueue]);
  const ref = useRef(sync);
  useEffect(() => {
    ref.current = sync;
  }, [sync]);
  const syncFn = useCallback(action => ref.current(action), [ref]);
  return syncFn;
}

// useSyncBackground: continuously synchronize accounts in background
function useSyncBackground({ sync }) {
  useEffect(() => {
    let syncTimeout;

    const syncLoop = async (reason: string) => {
      sync({
        type: "BACKGROUND_TICK",
        reason,
      });
      syncTimeout = setTimeout(syncLoop, getEnv("SYNC_ALL_INTERVAL"), "background");
    };

    syncTimeout = setTimeout(syncLoop, getEnv("SYNC_BOOT_DELAY"), "initial");
    return () => clearTimeout(syncTimeout);
  }, [sync]);
}

// useSyncContinouslyPendingOperations: continously sync accounts with pending operations
function useSyncContinouslyPendingOperations({ sync, accounts }) {
  const ids = useMemo(
    () => accounts.filter(a => a.pendingOperations.length > 0).map(a => a.id),
    [accounts],
  );
  const refIds = useRef(ids);
  useEffect(() => {
    refIds.current = ids;
  }, [ids]);
  useEffect(() => {
    let timeout;

    const update = () => {
      timeout = setTimeout(update, getEnv("SYNC_PENDING_INTERVAL"));
      if (!refIds.current.length) return;
      sync({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: refIds.current,
        priority: 20,
        reason: "pending-operations",
      });
    };

    timeout = setTimeout(update, getEnv("SYNC_PENDING_INTERVAL"));
    return () => clearTimeout(timeout);
  }, [sync]);
}

function withoutUndefineds<T>(a: Array<T | undefined>): T[] {
  return a.filter(Boolean) as T[];
}
