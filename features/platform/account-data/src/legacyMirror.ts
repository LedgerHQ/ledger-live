import {
  removeAccountBalances,
  replaceAccountBalances,
  toAccountBalances,
  type AccountBalance,
  type AccountBalancesState,
  type MainAccountForBalance,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import { AccountIdSchema, type AccountId } from "@shared/schema-primitives";

/** A legacy account, as the mirror reads it. `Account` from `@ledgerhq/types-live` satisfies this. */
export type MirroredAccount = MainAccountForBalance & { lastSyncDate: Date };

/**
 * The slice of an app store the mirror touches. Structural, so both apps' stores fit without this
 * package knowing either `State` type.
 *
 * `dispatch` is typed on the two actions the mirror emits rather than on a store's `Dispatch`: any
 * real dispatch accepts them, and naming them keeps the contract honest about what this writes.
 */
export type MirroredStore<S extends WithAccountBalances> = {
  getState(): S;
  dispatch(
    action: ReturnType<typeof replaceAccountBalances> | ReturnType<typeof removeAccountBalances>,
  ): unknown;
  subscribe(listener: () => void): () => void;
};

/**
 * Keep the balance table in step with the legacy `accounts` store.
 *
 * `BridgeSync` still owns account syncing, and every sync it runs produces balances as a side effect
 * — the legacy fan-out, except it is already happening in production. Mirroring it means the table is
 * correct for *every* family from the first boot, without waiting for a screen to ask, and without a
 * second writer racing `BridgeSync` for the account store.
 *
 * A plain store subscription rather than a middleware or a hook: it must run once per accounts
 * change, not once per action and not once per mounted component.
 *
 * `selectAccounts` is a parameter because the two apps genuinely differ — desktop keeps `Account[]`
 * at `state.accounts`, mobile keeps `{ active: Account[] }` — and the identity check below relies on
 * it returning the stored array, not a fresh one.
 *
 * @returns the unsubscribe function.
 */
export function mirrorLegacyAccountBalances<S extends WithAccountBalances>(
  store: MirroredStore<S>,
  selectAccounts: (state: S) => readonly MirroredAccount[],
): () => void {
  let previousAccounts: readonly MirroredAccount[] | undefined;

  const sync = () => {
    const state = store.getState();
    const accounts = selectAccounts(state);
    const { accountBalances } = state;
    if (accounts === previousAccounts) return;
    const known = previousAccounts;
    previousAccounts = accounts;

    for (const account of accounts) {
      const parentId = AccountIdSchema.parse(account.id);
      // The mirror revisits *every* account whenever any one of them syncs. Without this check it
      // would keep re-imposing the legacy `account.balance` on rows a granular source has since read
      // from the chain — and because the scheduler's `lastFetchedAt` would still look fresh, nothing
      // would refetch for `maxAge`. So it writes only when the legacy account is the newer
      // observation.
      if (!isNewerThanStored(account, accountBalances, parentId)) continue;
      const rows = toAccountBalances(account, account.lastSyncDate);
      const stale =
        !sameBalances(rows, accountBalances) ||
        // A token account that disappeared from the account is still a change, even when every
        // remaining row matches — the count is what gives it away.
        rows.length !== 1 + countSubRows(parentId, accountBalances);
      if (stale) store.dispatch(replaceAccountBalances({ accountId: parentId, balances: rows }));
    }

    const removed = (known ?? [])
      .filter(account => !accounts.some(current => current.id === account.id))
      .map(account => AccountIdSchema.parse(account.id));
    if (removed.length > 0) store.dispatch(removeAccountBalances(removed));
  };

  sync();
  return store.subscribe(sync);
}

/**
 * Whether the legacy account carries a more recent observation than the stored row.
 *
 * `lastSyncDate` is what `bridge.sync` stamps and `at` is what the account-data layer stamps, so
 * comparing them is what lets a chain read survive an unrelated account's sync — while still letting
 * a genuinely newer full sync win.
 */
const isNewerThanStored = (
  account: MirroredAccount,
  table: AccountBalancesState,
  accountId: AccountId,
): boolean => {
  const stored = table[accountId];
  if (!stored) return true;
  return account.lastSyncDate.getTime() >= new Date(stored.at).getTime();
};

const countSubRows = (parentId: AccountId, table: AccountBalancesState): number =>
  Object.values(table).filter(row => row.parentId === parentId).length;

/** `at` is excluded on purpose: a fresh timestamp on an unchanged amount is not a change to store. */
const sameBalances = (rows: AccountBalance[], table: AccountBalancesState): boolean =>
  rows.every(row => {
    const stored = table[row.accountId];
    return (
      stored !== undefined &&
      stored.balance === row.balance &&
      stored.spendableBalance === row.spendableBalance &&
      stored.assetId === row.assetId &&
      stored.parentId === row.parentId
    );
  });
