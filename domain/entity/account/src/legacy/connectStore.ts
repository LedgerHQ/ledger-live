import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { LegacyAccountEntry } from "../schema";
import { legacyAccountsSynced } from "../slice";
import { AccountIdSchema } from "./schema";

export type AccountsReduxStore<S> = {
  getState: () => S;
  dispatch: (action: ReturnType<typeof legacyAccountsSynced>) => unknown;
  subscribe: (listener: () => void) => () => void;
};

export type ConnectAccountsOptions<S, A extends { id: string }> = {
  selectLegacyAccounts: (state: S) => readonly A[];
  /** Throws for an account no descriptor can express; that account is then left out. */
  toDescriptor: (account: A) => AccountDescriptor;
  onError?: (error: unknown, account: A) => void;
};

const sameIds = (accounts: readonly { id: string }[], ids: readonly string[]) =>
  accounts.length === ids.length && accounts.every((account, i) => account.id === ids[i]);

/** Mirrors the legacy accounts into the accounts slice whenever one is added, removed or reordered. */
export function connectAccountsStore<S, A extends { id: string }>(
  store: AccountsReduxStore<S>,
  { selectLegacyAccounts, toDescriptor, onError }: ConnectAccountsOptions<S, A>,
): () => void {
  let lastAccounts: readonly A[] | undefined;
  let ids: string[] | undefined;
  // A legacy account never changes identity, so it converts once.
  let converted = new Map<string, LegacyAccountEntry | null>();

  const convert = (account: A): LegacyAccountEntry | null => {
    try {
      const legacyId = AccountIdSchema.parse(account.id);
      const descriptor = toDescriptor(account);
      return { legacyId, descriptor, accountUUID: computeAccountUUID(descriptor) };
    } catch (error) {
      onError?.(error, account);
      return null;
    }
  };

  const sync = () => {
    const accounts = selectLegacyAccounts(store.getState());
    if (accounts === lastAccounts) return;
    lastAccounts = accounts;
    if (ids && sameIds(accounts, ids)) return;
    ids = accounts.map(account => account.id);
    const next = new Map<string, LegacyAccountEntry | null>();
    const entries: LegacyAccountEntry[] = [];
    for (const account of accounts) {
      const cached = converted.get(account.id);
      const entry = cached === undefined ? convert(account) : cached;
      next.set(account.id, entry);
      if (entry) entries.push(entry);
    }
    converted = next;
    store.dispatch(legacyAccountsSynced(entries));
  };

  sync();
  return store.subscribe(sync);
}
