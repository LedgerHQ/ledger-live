import type { AccountUUID } from "@domain/entity-account";
import type { AccountContext } from "../schema";
import { legacyAccountContextsSynced } from "../slice";

export type AccountContextsReduxStore<S> = {
  getState: () => S;
  dispatch: (action: ReturnType<typeof legacyAccountContextsSynced>) => unknown;
  subscribe: (listener: () => void) => () => void;
};

export type ConnectAccountContextsOptions<S, A extends { id: string }> = {
  selectLegacyAccounts: (state: S) => readonly A[];
  /** Throws for an account no descriptor can express; that account is then left out. */
  toAccountUUID: (account: A) => AccountUUID;
  /** The context the legacy account keeps, none for most families. */
  toContext: (account: A) => AccountContext | undefined;
  onError?: (error: unknown, account: A) => void;
};

type Mirrored = { accountUUID: AccountUUID; context: AccountContext };

type Contexts = ReadonlyMap<AccountUUID, AccountContext>;

const sameContexts = (a: Contexts, b: Contexts) =>
  a.size === b.size && [...a].every(([accountUUID, context]) => b.get(accountUUID) === context);

/** Mirrors the contexts the legacy accounts keep into the account context slice whenever one is added or removed. Connect once per store: a new connection does not know what a previous one mirrored, so it cannot drop the context of an account removed in between. */
export function connectAccountContextsStore<S, A extends { id: string }>(
  store: AccountContextsReduxStore<S>,
  { selectLegacyAccounts, toAccountUUID, toContext, onError }: ConnectAccountContextsOptions<S, A>,
): () => void {
  let lastAccounts: readonly A[] | undefined;
  // A legacy account id never changes, and its context lives in it: each account converts once.
  let converted = new Map<string, Mirrored | null>();
  // An account that failed is converted again once it changes, as when a sync backfills a key; reported once.
  let failed = new Map<string, A>();
  let mirrored: Contexts = new Map();

  const convert = (
    account: A,
    nextConverted: Map<string, Mirrored | null>,
    nextFailed: Map<string, A>,
  ): Mirrored | null => {
    if (converted.has(account.id)) {
      const entry = converted.get(account.id) ?? null;
      nextConverted.set(account.id, entry);
      return entry;
    }
    if (failed.get(account.id) === account) {
      nextFailed.set(account.id, account);
      return null;
    }
    try {
      const context = toContext(account);
      const entry = context ? { accountUUID: toAccountUUID(account), context } : null;
      nextConverted.set(account.id, entry);
      return entry;
    } catch (error) {
      if (!failed.has(account.id)) onError?.(error, account);
      nextFailed.set(account.id, account);
      return null;
    }
  };

  const sync = () => {
    const accounts = selectLegacyAccounts(store.getState());
    if (accounts === lastAccounts) return;
    lastAccounts = accounts;
    const nextConverted = new Map<string, Mirrored | null>();
    const nextFailed = new Map<string, A>();
    // Two legacy ids on one UUID: the last one's context wins, as the reducer would keep it.
    const next = new Map<AccountUUID, AccountContext>();
    for (const account of accounts) {
      const entry = convert(account, nextConverted, nextFailed);
      if (entry) next.set(entry.accountUUID, entry.context);
    }
    converted = nextConverted;
    failed = nextFailed;
    if (sameContexts(mirrored, next)) return;
    const removed = [...mirrored.keys()].filter(accountUUID => !next.has(accountUUID));
    mirrored = next;
    const contexts = [...next].map(([accountUUID, context]) => ({ accountUUID, context }));
    store.dispatch(legacyAccountContextsSynced({ contexts, removed }));
  };

  sync();
  return store.subscribe(sync);
}
