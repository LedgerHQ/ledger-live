import type { Account } from "@ledgerhq/types-live";
import {
  removeAccountBalances,
  replaceAccountBalances,
  toAccountBalances,
  type AccountBalance,
} from "@domain/entity-account-balance";
import { AccountIdSchema, type AccountId } from "@shared/schema-primitives";
import type { State } from "~/renderer/reducers";
import type { ReduxStore } from "~/state-manager/configureStore";

/**
 * Keep the balance table in step with the legacy `accounts` store.
 *
 * `BridgeSync` still owns account syncing, and every sync it runs produces balances as a side effect
 * — the `LegacyBridgeSource` fan-out, except it is already happening in production. Mirroring it here
 * means the table is correct for *every* family from the first boot, without waiting for a screen to
 * ask, and without a second writer racing `BridgeSync` for the account store.
 *
 * It is a plain store subscription rather than a middleware or a hook: it must run once per accounts
 * change, not once per action and not once per mounted component.
 */
export function mirrorLegacyAccountBalances(store: ReduxStore): () => void {
  let previousAccounts: State["accounts"] | undefined;

  const sync = () => {
    const state = store.getState();
    const accounts = state.accounts;
    if (accounts === previousAccounts) return;
    const known = previousAccounts;
    previousAccounts = accounts;

    for (const account of accounts) {
      const parentId = AccountIdSchema.parse(account.id);
      // The mirror runs on every accounts-array change, which means it revisits *every* account
      // whenever any one of them syncs. Without this check it would keep re-imposing the legacy
      // `account.balance` on rows a granular source has since read from the chain — and because the
      // scheduler's `lastFetchedAt` would still look fresh, nothing would refetch for `maxAge`. So
      // the mirror only writes when the legacy account is itself the newer observation.
      if (!isNewerThanStored(account, state.accountBalances, parentId)) continue;
      const rows = toAccountBalances(account, account.lastSyncDate);
      const stale =
        !sameBalances(rows, state.accountBalances) ||
        // A token account that disappeared from the account is still a change, even when every
        // remaining row matches — the count is what gives it away.
        rows.length !== 1 + countSubRows(parentId, state.accountBalances);
      if (stale) store.dispatch(replaceAccountBalances({ accountId: parentId, balances: rows }));
    }

    const removed = (known ?? [])
      .filter((account: Account) => !accounts.some(current => current.id === account.id))
      .map((account: Account) => AccountIdSchema.parse(account.id));
    if (removed.length > 0) store.dispatch(removeAccountBalances(removed));
  };

  sync();
  return store.subscribe(sync);
}

/**
 * Whether the legacy account carries a more recent observation than the stored row.
 *
 * `lastSyncDate` is what `bridge.sync` stamps, and `at` is what the account-data layer stamps, so
 * comparing the two is what lets a chain read survive an unrelated account's sync — and still lets a
 * genuinely newer full sync win.
 */
const isNewerThanStored = (
  account: Account,
  table: State["accountBalances"],
  accountId: AccountId,
): boolean => {
  const stored = table[accountId];
  if (!stored) return true;
  return account.lastSyncDate.getTime() >= new Date(stored.at).getTime();
};

const countSubRows = (parentId: AccountId, table: State["accountBalances"]): number =>
  Object.values(table).filter(row => row.parentId === parentId).length;

/** `at` is excluded on purpose: a fresh timestamp on an unchanged amount is not a change to store. */
const sameBalances = (rows: AccountBalance[], table: State["accountBalances"]): boolean =>
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
