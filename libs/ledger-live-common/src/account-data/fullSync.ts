import { NEVER, fromEvent, lastValueFrom, race, throwError, type Observable } from "rxjs";
import { mergeMap, reduce } from "rxjs/operators";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";

/**
 * Run one full `AccountBridge.sync()` and hand back the synced account.
 *
 * The compatibility path both full-sync sources share, so the abort semantics are right in one
 * place: `takeUntil` upstream of `reduce` would *complete* the stream, making `reduce` emit its
 * seed — the **un-synced** account — which the caller would then store as fresh data. Aborting has
 * to reject, so the caller records an error rather than stale data stamped as current.
 */
export async function syncAccountOnce({
  account,
  bridge,
  blacklistedTokenIds = [],
  signal,
}: {
  account: Account;
  bridge: Pick<AccountBridge<TransactionCommon>, "sync">;
  blacklistedTokenIds?: string[];
  signal?: AbortSignal;
}): Promise<Account> {
  if (signal?.aborted) throw new DOMException("aborted before the sync started", "AbortError");

  const synced$ = bridge
    .sync(account, { paginationConfig: {}, blacklistedTokenIds })
    .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account));

  const aborted$: Observable<Account> = signal
    ? fromEvent(signal, "abort").pipe(
        mergeMap(() => throwError(() => new DOMException("sync aborted", "AbortError"))),
      )
    : NEVER;

  // `race` resolves on whichever settles first: the reduced account, or the abort's error.
  return lastValueFrom(race(synced$, aborted$));
}
