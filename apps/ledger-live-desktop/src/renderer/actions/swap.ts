import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account } from "@ledgerhq/types-live";
import { createAction } from "redux-actions";
import { createSelector } from "reselect";
import { State } from "~/renderer/reducers";
import { ExchangeRate, Pair } from "@ledgerhq/live-common/exchange/swap/types";

/* ACTIONS */
export const updateTransactionAction = createAction<Transaction | undefined | null>(
  "SWAP/UPDATE_TRANSACTION",
);

export const updateRateAction = createAction<ExchangeRate | undefined | null>("SWAP/UPDATE_RATE");

export const filterAvailableToAssets = (pairs: Pair[] | null | undefined, fromId?: string) => {
  if (pairs === null || pairs === undefined) return null;
  const toAssets = [];
  for (const pair of pairs) {
    if (!fromId || pair.from === fromId) {
      toAssets.push(pair.to);
    }
  }
  return [...new Set(toAssets)];
};

// Put disabled accounts and subaccounts at the bottom of the list while preserving the parent/children position.
export function sortAccountsByStatus(accounts: (Account & { disabled: boolean })[]) {
  let activeAccounts: Account[] = [];
  let disabledAccounts: Account[] = [];
  let subAccounts = [];
  let disabledSubAccounts = [];

  // Traverse the accounts in reverse to check disabled accounts with active subAccounts
  for (let i = accounts.length - 1; i >= 0; i--) {
    const account = accounts[i];

    // Handle Account type first
    if (account.type === "Account") {
      if (account.disabled && !subAccounts.length) {
        // When a disabled account has no active subAccount, add it to the disabledAccounts
        disabledAccounts = [account, ...disabledSubAccounts, ...disabledAccounts];
      } else {
        // When an account has at least an active subAccount, add it to the activeAccounts
        activeAccounts = [account, ...subAccounts, ...disabledSubAccounts, ...activeAccounts];
      }

      // Clear subAccounts
      subAccounts = [];
      disabledSubAccounts = [];
    } else {
      // Add TokenAccount to the subAccounts arrays
      if (account.disabled) {
        disabledSubAccounts.unshift(account);
      } else {
        subAccounts.unshift(account);
      }
    }
  }
  return [...activeAccounts, ...disabledAccounts];
}

export const transactionSelector = createSelector(
  (state: State) => state.swap,
  swap => swap.transaction,
);

export const rateSelector = createSelector(
  (state: State) => state.swap,
  swap => swap.exchangeRate,
);
