import {
  NEVER,
  defaultIfEmpty,
  defer,
  fromEvent,
  lastValueFrom,
  map,
  scan,
  switchMap,
  takeUntil,
} from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { abortReason } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { getAccountBridge } from "../../bridge";
import { legacySyncConfig } from "../../bridge/syncConfig";
import { placeholderAccount } from "./placeholderAccount";
import type { SyncLegacyAccountOptions } from "./syncLegacyAccount";

/** One sync of an account the store does not hold (a discovery candidate), kept out of the store. */
export function syncDetached(
  descriptor: AccountDescriptor,
  {
    prepareCurrency,
    blacklistedTokenIds,
  }: Omit<SyncLegacyAccountOptions, "updateAccountWithUpdater">,
  signal: AbortSignal | undefined,
): Promise<Account> {
  if (signal?.aborted) return Promise.reject(abortReason(signal));
  // One observable from the placeholder to the sync, so aborting at any step releases the read at once.
  const synced$ = defer(() => placeholderAccount(descriptor)).pipe(
    switchMap(placeholder =>
      defer(() => prepareCurrency(placeholder.currency)).pipe(
        switchMap(() => getAccountBridge(placeholder)),
        switchMap(bridge =>
          bridge
            .sync(placeholder, legacySyncConfig(placeholder.currency.id, blacklistedTokenIds))
            .pipe(
              scan((account, updater) => updater(account), placeholder),
              defaultIfEmpty(placeholder),
            ),
        ),
      ),
    ),
  );
  const aborted$ = signal
    ? fromEvent(signal, "abort").pipe(
        map(() => {
          throw abortReason(signal);
        }),
      )
    : NEVER;
  return lastValueFrom(synced$.pipe(takeUntil(aborted$)));
}
