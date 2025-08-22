import { createSelector } from "reselect";
import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { State } from "../reducers";

// Base selector for the fresh balances state
export const freshBalancesSelector = (state: State) => state.freshBalances;

// Get fresh balance for a specific account ID
export const freshBalanceSelector = (accountId: string) =>
  createSelector([freshBalancesSelector], balances => balances[accountId] || null);

// Get fresh balance for an account object
export const accountFreshBalanceSelector = (account: Account) =>
  createSelector([freshBalancesSelector], balances => balances[account.id] || null);

// Check if an account has a fresh balance
export const hasFreshBalanceSelector = (accountId: string) =>
  createSelector([freshBalancesSelector], balances => accountId in balances);

// Get the display balance for an account (fresh if available, otherwise account.balance)
export const displayBalanceSelector = (account: Account) =>
  createSelector(
    [freshBalancesSelector],
    (balances): BigNumber => balances[account.id] || account.balance,
  );
