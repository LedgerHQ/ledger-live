import { useCallback, useEffect } from "react";
import { from, switchMap } from "rxjs";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { Account } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import {
  removeShieldedSubscription,
  selectShieldedSubscriptions,
  upsertShieldedSubscription,
} from "~/renderer/reducers/shieldedSyncSubscriptions";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import type { ZcashAccountBridge } from "@ledgerhq/coin-zcash/bridge";
import type { Currency } from "@ledgerhq/wallet-btc/index";
import { syncStateUpdater } from "./ZCashExportKeyFlowModal/sync";

// The bridge registry returns a generic AccountBridge. When zcashShielded is on,
// the runtime value is always ZcashAccountBridge — assert that rather than casting blindly.
function assertZcashBridge(bridge: unknown): asserts bridge is ZcashAccountBridge {
  if (
    typeof (bridge as ZcashAccountBridge).getFullViewingKey !== "function" ||
    typeof (bridge as ZcashAccountBridge).deriveShieldedAddress !== "function"
  ) {
    throw new Error("[zcashShielded] expected ZcashAccountBridge — is the feature flag on?");
  }
}

export function useZcashBridge(account: Account): ZcashAccountBridge {
  const bridge = useAccountBridge(account);
  assertZcashBridge(bridge);
  return bridge;
}

export function useZcashShieldedSync(account: ZcashAccount) {
  const dispatch = useDispatch();
  const shieldedSubscriptions = useSelector(selectShieldedSubscriptions);
  const bridge = useZcashBridge(account);

  const saveSyncState = useCallback(
    (info: Partial<ZcashPrivateInfo>) => {
      dispatch(syncStateUpdater(account, info));
    },
    [account, dispatch],
  );

  const zcashPrivateInfo = account.privateInfo as ZcashPrivateInfo | undefined;
  const ufvk = zcashPrivateInfo?.ufvk ?? null;
  const shieldedAddress = zcashPrivateInfo?.shieldedAddress ?? null;

  // Self-heal: accounts activated before this feature landed have a UFVK but no
  // shieldedAddress. Derive it host-side on mount without touching the device.
  //
  // Concurrency: if deps change while a derive is in-flight (e.g. account identity
  // changes), React runs the cleanup (`active = false`) before the next effect fires.
  // The in-flight promise still resolves but its `if (active)` guard is false, so the
  // stale result is discarded. Only the latest effect's result is ever dispatched.
  useEffect(() => {
    if (!ufvk || shieldedAddress) return;

    let active = true;
    bridge
      .deriveShieldedAddress(ufvk)
      .then(addr => {
        if (active) saveSyncState({ shieldedAddress: addr });
      })
      .catch(() => {
        // Error intentionally not logged: IPC/Zaino errors can echo request
        // parameters and the UFVK must never appear in logs (privacy requirement).
        console.warn("Zcash self-heal: deriveShieldedAddress failed, will retry on next mount");
      });

    return () => {
      active = false;
    };
  }, [ufvk, shieldedAddress, bridge, saveSyncState]);

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
