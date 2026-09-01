import { createSelector } from "@reduxjs/toolkit";
import type { AccountId } from "@shared/schema-primitives";
import type { AccountBalance, WithAccountBalances } from "./schema";

const NO_BALANCES: readonly AccountBalance[] = [];

const accountBalancesTableSelector = (state: WithAccountBalances) => state.accountBalances;

/**
 * Token-account balances grouped by parent account id.
 *
 * The parent → children link lives on the rows themselves, so this index is derived rather than
 * stored: nothing to keep in sync, nothing to leak. `createSelector` memoizes it per table
 * identity, so the O(n) grouping runs once per balance change and not once per reading component.
 */
const subAccountBalancesIndexSelector = createSelector(accountBalancesTableSelector, table => {
  const index: Record<AccountId, AccountBalance[]> = {};
  for (const balance of Object.values(table)) {
    if (!balance.parentId) continue;
    const siblings = index[balance.parentId] ?? [];
    siblings.push(balance);
    index[balance.parentId] = siblings;
  }
  return index;
});

/** The account's own balance, or `undefined` when it was never fetched. */
export const accountBalanceSelector = (
  state: WithAccountBalances,
  { accountId }: { accountId: AccountId },
): AccountBalance | undefined => state.accountBalances[accountId];

/** Balances of the token accounts the given account parents. Empty when there are none. */
export const subAccountBalancesSelector = (
  state: WithAccountBalances,
  { accountId }: { accountId: AccountId },
): readonly AccountBalance[] => subAccountBalancesIndexSelector(state)[accountId] ?? NO_BALANCES;

/** Whether a balance is known for this account — the "have we ever fetched it" question. */
export const hasAccountBalanceSelector = (
  state: WithAccountBalances,
  { accountId }: { accountId: AccountId },
): boolean => state.accountBalances[accountId] !== undefined;
