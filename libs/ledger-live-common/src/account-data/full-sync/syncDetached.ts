import { defer, scan, switchMap } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { getAccountBridge } from "../../bridge";
import { legacySyncConfig } from "../../bridge/syncConfig";
import { lastValueUntilAborted } from "../abort";
import { placeholderAccount } from "./placeholderAccount";
import type { SyncLegacyAccountOptions } from "./syncLegacyAccount";

/** One sync of an account the store does not hold (a discovery candidate), kept out of the store. */
export async function syncDetached(
  descriptor: AccountDescriptor,
  {
    prepareCurrency,
    blacklistedTokenIds,
  }: Omit<SyncLegacyAccountOptions, "updateAccountWithUpdater">,
  signal: AbortSignal | undefined,
): Promise<Account> {
  const placeholder = await placeholderAccount(descriptor);
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
