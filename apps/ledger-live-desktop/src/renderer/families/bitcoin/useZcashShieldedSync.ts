import { useCallback } from "react";
import { from, switchMap } from "rxjs";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
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
  const shieldedSubscriptions = useSelector(selectShieldedSubscriptions);

  const saveSyncState = useCallback(
    (info: Partial<ZcashPrivateInfo>) => {
      dispatch(syncStateUpdater(account, info));
    },
    [account, dispatch],
  );

  const clearExistingSubscription = useCallback(() => {
    const existing = shieldedSubscriptions.find(s => s.accountId === account.id);
    if (existing) {
      existing.subscription.unsubscribe();
      dispatch(removeShieldedSubscription(account.id));
    }
  }, [account.id, dispatch, shieldedSubscriptions]);

  const startShieldedSync = useCallback(() => {
    if (account.type !== "Account" || (account.currency.id as Currency) !== "zcash") return;

    // Without a UFVK the shielded sync observable throws immediately, so there's
    // nothing to start. Bail out before flipping the UI into "running".
    if (!account.privateInfo?.ufvk) return;

    // Cancel any in-flight sync so a repeated CTA click doesn't leak/duplicate
    // the previous RxJS subscription.
    clearExistingSubscription();

    saveSyncState({ syncState: "running", progress: 0 });

    // The coin module only builds the shielded sync observable when the account's
    // privateInfo.syncState is an enabled state (ready/running/stopped/outdated).
    // The banner also treats "disabled" as startable, so pass an account with
    // syncState forced to "running" to ensure the observable is actually built —
    // otherwise the CTA would leave the UI stuck in a running state without syncing.
    const accountForSync: ZcashAccount = {
      ...account,
      privateInfo: { ...account.privateInfo, syncState: "running" },
    };

    const syncConfig = { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED };
    const shieldedSync = from(Promise.resolve(getAccountBridge(accountForSync)))
      .pipe(switchMap(bridge => bridge.sync(accountForSync, syncConfig)))
      .subscribe({
        next(updater) {
          dispatch(updateAccountWithUpdater(account.id, updater));
        },
        error(err) {
          console.warn("Zcash shielded sync error:", err);
          dispatch(removeShieldedSubscription(account.id));
          // Reset to "stopped" so the banner exposes a retry CTA instead of
          // staying stuck on the running spinner.
          saveSyncState({ syncState: "stopped", progress: 0 });
        },
        complete() {
          console.log(`Zcash shielded sync completed on account ${account.id}`);
          dispatch(removeShieldedSubscription(account.id));
        },
      });
    dispatch(upsertShieldedSubscription({ accountId: account.id, subscription: shieldedSync }));
  }, [account, dispatch, saveSyncState, clearExistingSubscription]);

  const stopShieldedSync = useCallback(() => {
    if (account.type !== "Account" || (account.currency.id as Currency) !== "zcash") return;

    clearExistingSubscription();
    saveSyncState({ syncState: "stopped", progress: 0 });
  }, [account, saveSyncState, clearExistingSubscription]);

  return { saveSyncState, startShieldedSync, stopShieldedSync };
}
