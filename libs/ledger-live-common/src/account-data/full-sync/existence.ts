import { defer, scan, switchMap } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { getAccountBridge } from "../../bridge";
import { legacySyncConfig } from "../../bridge/syncConfig";
import { resolveFamily } from "../../bridge/zcashRouting";
import { defaultIsAccountEmpty } from "../../bridge/defaultBridgeExtensions";
import { loadBridgeExtensionsForFamily } from "../../coin-modules/registry";
import { lastValueUntilAborted } from "../abort";
import { placeholderAccount } from "./placeholderAccount";
import type { SyncLegacyAccountOptions } from "./syncLegacyAccount";

/** Whether a synced account has history by the family's own rule: the sync's `used` flag applies the generic one. */
export async function isAccountUsed(account: Account): Promise<boolean> {
  const extensions = await loadBridgeExtensionsForFamily(resolveFamily(account.currency));
  return !(extensions.isAccountEmpty ?? defaultIsAccountEmpty)(account);
}

/** One sync of an account the store does not hold (a discovery candidate), kept out of the store. */
export async function syncDetached(
  descriptor: AccountDescriptor,
  {
    prepareCurrency,
    blacklistedTokenIds,
  }: Omit<SyncLegacyAccountOptions, "updateAccountWithUpdater">,
  signal: AbortSignal | undefined,
): Promise<Account> {
  const placeholder = placeholderAccount(descriptor);
  // One observable from preparation to sync, so aborting at any step releases the read at once.
  const synced$ = defer(() => prepareCurrency(placeholder.currency)).pipe(
    switchMap(() => getAccountBridge(placeholder)),
    switchMap(bridge =>
      bridge
        .sync(placeholder, legacySyncConfig(placeholder.currency.id, blacklistedTokenIds))
        .pipe(scan((account, updater) => updater(account), placeholder)),
    ),
  );
  return lastValueUntilAborted(synced$, signal, placeholder);
}
