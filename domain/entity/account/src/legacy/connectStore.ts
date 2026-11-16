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
  let converted = new Map<string, LegacyAccountEntry>();
  // An account that failed is converted again once it changes, as when a sync backfills a key; reported once.
  let failed = new Map<string, A>();

  const convert = (account: A): LegacyAccountEntry | null => {
    try {
      const legacyId = AccountIdSchema.parse(account.id);
      const descriptor = toDescriptor(account);
      return { legacyId, descriptor, accountUUID: computeAccountUUID(descriptor) };
    } catch (error) {
      if (!failed.has(account.id)) onError?.(error, account);
      return null;
    }
  };

  const retriable = (accounts: readonly A[]) =>
    accounts.some(account => failed.has(account.id) && failed.get(account.id) !== account);

  const sync = () => {
    const accounts = selectLegacyAccounts(store.getState());
    if (accounts === lastAccounts) return;
    lastAccounts = accounts;
    const sameList = ids !== undefined && sameIds(accounts, ids);
    if (sameList && !retriable(accounts)) return;
    ids = accounts.map(account => account.id);
    const nextConverted = new Map<string, LegacyAccountEntry>();
    const nextFailed = new Map<string, A>();
    const entries: LegacyAccountEntry[] = [];
    let recovered = false;
    for (const account of accounts) {
      const cached = converted.get(account.id);
      const entry = cached ?? (failed.get(account.id) === account ? null : convert(account));
      if (entry) {
        if (!cached) recovered ||= failed.has(account.id);
        nextConverted.set(account.id, entry);
        entries.push(entry);
      } else {
        nextFailed.set(account.id, account);
      }
    }
    converted = nextConverted;
    failed = nextFailed;
    if (!sameList || recovered) store.dispatch(legacyAccountsSynced(entries));
  };

  sync();
  return store.subscribe(sync);
}
