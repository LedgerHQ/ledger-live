import { AccountBalance } from "@ledgerhq/types-live";
import { createAction } from "redux-actions";

// Action Types
export const FRESH_BALANCES_UPDATE = "FRESH_BALANCES_UPDATE";
export const FRESH_BALANCES_CLEAR = "FRESH_BALANCES_CLEAR";
export const FRESH_BALANCES_CLEAR_ACCOUNT = "FRESH_BALANCES_CLEAR_ACCOUNT";

// Action Creators
export const updateFreshBalances = createAction<AccountBalance[]>(FRESH_BALANCES_UPDATE);

export const clearFreshBalances = createAction(FRESH_BALANCES_CLEAR);

export const clearFreshBalancesForAccount = createAction<string>(
  FRESH_BALANCES_CLEAR_ACCOUNT,
);

// Types for actions
export type FreshBalancesActions =
  | ReturnType<typeof updateFreshBalances>
  | ReturnType<typeof clearFreshBalances>
  | ReturnType<typeof clearFreshBalancesForAccount>;
