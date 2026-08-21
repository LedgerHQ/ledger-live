import { useCallback } from "react";
import { from, switchMap } from "rxjs";
import { useDispatch, useStore } from "LLD/hooks/redux";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { accountSelector } from "~/renderer/reducers/accounts";
import {
  removeShieldedSubscription,
  selectShieldedSubscriptions,
  upsertShieldedSubscription,
} from "~/renderer/reducers/shieldedSyncSubscriptions";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import type { Currency } from "@ledgerhq/wallet-btc/index";
import { syncStateUpdater } from "./ZCashExportKeyFlowModal/sync";

export function useZcashShieldedSync(account: ZcashAccount) {
  const dispatch = useDispatch();
  const store = useStore();

  // Reads the store directly instead of a hook closure: a retry loop (see
  // ZcashPostBroadcastSync) can call these long after this hook's owning
  // component unmounted, when React has stopped refreshing that closure.
  const currentAccountOf = useCallback(
    (fallback: ZcashAccount): ZcashAccount =>
      (accountSelector(store.getState(), { accountId: fallback.id }) as ZcashAccount | undefined) ??
      fallback,
    [store],
  );
  const isSubscribedTo = useCallback(
    (accountId: string) =>
      selectShieldedSubscriptions(store.getState()).some(s => s.accountId === accountId),
    [store],
  );

  const saveSyncState = useCallback(
    (info: Partial<ZcashPrivateInfo>) => {
      dispatch(syncStateUpdater(account, info));
    },
    [account, dispatch],
  );

  const clearExistingSubscription = useCallback(() => {
    const existing = selectShieldedSubscriptions(store.getState()).find(
      s => s.accountId === account.id,
    );
    if (existing) {
      existing.subscription.unsubscribe();
      dispatch(removeShieldedSubscription(account.id));
    }
  }, [account.id, dispatch, store]);

  const startShieldedSync = useCallback(() => {
    const currentAccount = currentAccountOf(account);
    if (currentAccount.type !== "Account" || (currentAccount.currency.id as Currency) !== "zcash")
      return;

    // Without a UFVK the shielded sync observable throws immediately, so there's
    // nothing to start. Bail out before flipping the UI into "running".
    if (!currentAccount.privateInfo?.ufvk) return;

    if (isSubscribedTo(currentAccount.id)) return;
    if (currentAccount.privateInfo?.syncState === "running") return;

    saveSyncState({ syncState: "running", progress: 0, lastSyncError: null });

    // The coin module only builds the shielded sync observable when the account's
    // privateInfo.syncState is an enabled state (ready/running/stopped/outdated).
    // The banner also treats "disabled" as startable, so pass an account with
    // syncState forced to "running" to ensure the observable is actually built —
    // otherwise the CTA would leave the UI stuck in a running state without syncing.
    const accountForSync: ZcashAccount = {
      ...currentAccount,
      privateInfo: { ...currentAccount.privateInfo, syncState: "running" },
    };

    const syncConfig = { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED };
    const shieldedSync = from(Promise.resolve(getAccountBridge(accountForSync)))
      .pipe(switchMap(bridge => bridge.sync(accountForSync, syncConfig)))
      .subscribe({
        next(updater) {
          dispatch(updateAccountWithUpdater(currentAccount.id, updater));
        },
        error(err) {
          console.warn("Zcash shielded sync error:", err);
          dispatch(removeShieldedSubscription(currentAccount.id));
          // Reset to "stopped" so the banner exposes a retry CTA instead of
          // staying stuck on the running spinner.
          saveSyncState({ syncState: "stopped", progress: 0 });
        },
        complete() {
          console.log(`Zcash shielded sync completed on account ${currentAccount.id}`);
          dispatch(removeShieldedSubscription(currentAccount.id));
        },
      });
    dispatch(
      upsertShieldedSubscription({ accountId: currentAccount.id, subscription: shieldedSync }),
    );
  }, [account, currentAccountOf, isSubscribedTo, dispatch, saveSyncState]);

  const stopShieldedSync = useCallback(() => {
    const currentAccount = currentAccountOf(account);
    if (currentAccount.type !== "Account" || (currentAccount.currency.id as Currency) !== "zcash")
      return;
    if (!isSubscribedTo(currentAccount.id)) return;

    clearExistingSubscription();
    saveSyncState({ syncState: "stopped", progress: 0 });
  }, [account, currentAccountOf, isSubscribedTo, saveSyncState, clearExistingSubscription]);

  return { saveSyncState, startShieldedSync, stopShieldedSync };
}
