import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";

export type SyncAccountOnceInput = {
  account: Account;
  bridge: Pick<AccountBridge<TransactionCommon>, "sync">;
  blacklistedTokenIds?: string[];
  signal?: AbortSignal;
};

const inflight = new Map<string, Promise<Account>>();

// Codepoint order, not `localeCompare`: this builds a cache key, so it has to be locale-independent.
const byCodepoint = (a: string, b: string): number => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

const keyOf = (account: Account, blacklistedTokenIds: readonly string[]): string =>
  `${account.id}|${[...blacklistedTokenIds].sort(byCodepoint).join(",")}`;

const abortion = (signal: AbortSignal): { promise: Promise<never>; release: () => void } => {
  let onAbort!: () => void;
  const promise = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(new DOMException("sync aborted", "AbortError"));
    // An aborted signal never fires `abort` again, so a listener alone would wait forever.
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
  return { promise, release: () => signal.removeEventListener("abort", onAbort) };
};

function runSync({ account, bridge, blacklistedTokenIds = [] }: SyncAccountOnceInput) {
  return lastValueFrom(
    bridge
      .sync(account, { paginationConfig: {}, blacklistedTokenIds })
      .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account)),
  );
}

/**
 * Run one full `AccountBridge.sync()` per account, per instant: on a family with no granular coin
 * module both the balance and the operations slice fall back here, and their thunks cannot see each
 * other. In flight only — freshness stays each slice's own business. A caller's `signal` stops that
 * caller waiting; it does not cancel the shared run.
 */
export async function syncAccountOnce(input: SyncAccountOnceInput): Promise<Account> {
  const { account, blacklistedTokenIds = [], signal } = input;
  if (signal?.aborted) throw new DOMException("aborted before the sync started", "AbortError");

  const key = keyOf(account, blacklistedTokenIds);
  let shared = inflight.get(key);
  if (!shared) {
    shared = runSync(input).finally(() => {
      if (inflight.get(key) === shared) inflight.delete(key);
    });
    void shared.catch(() => undefined);
    inflight.set(key, shared);
  }

  if (!signal) return shared;
  const { promise, release } = abortion(signal);
  try {
    return await Promise.race([shared, promise]);
  } finally {
    release();
  }
}
