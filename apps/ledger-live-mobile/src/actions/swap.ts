import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { flattenAccounts } from "@ledgerhq/live-common/account/helpers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import memoize from "lodash/memoize";
import { createAction } from "redux-actions";
import { createSelector } from "reselect";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExchangeRate, Pair } from "@ledgerhq/live-common/exchange/swap/types";
import { UPDATE_PROVIDERS_TYPE } from "../reducers/swap";
import type { State } from "../reducers";

/* ACTIONS */
export const updateProvidersAction = createAction<
  UPDATE_PROVIDERS_TYPE["payload"]
>("SWAP/UPDATE_PROVIDERS");

export const updateTransactionAction = createAction<
  Transaction | null | undefined
>("SWAP/UPDATE_TRANSACTION");
export const updateRateAction = createAction<ExchangeRate | null | undefined>(
  "SWAP/UPDATE_RATE",
);

export const resetSwapAction = createAction("SWAP/RESET_STATE");

/* SELECTORS */
export const providersSelector = (state: State) => state.swap.providers;
export const pairsSelector = (state: State) => state.swap.pairs || [];
export const transactionSelector = (state: State) => state.swap.transaction;
export const rateSelector = (state: State) => state.swap.exchangeRate;
export const rateExpirationSelector = (state: State) =>
  state.swap.exchangeRateExpiration;

export const toSelector = createSelector(
  pairsSelector,
  pairs => (fromId?: string) => {
    if (!fromId || !pairs) return [];
    const filteredAssets = filterAvailableToAssets(pairs, fromId);
    const uniqueAssetList = [...new Set(filteredAssets)];
    return uniqueAssetList;
  },
);

function filterAvailableToAssets(
  pairs: Pair[],
  fromId?: string,
): string[] | null {
  if (pairs === null || pairs === undefined) return null;

  if (fromId)
    return pairs.reduce<string[]>(
      (acc, pair) => (pair.from === fromId ? [...acc, pair.to] : acc),
      [],
    );

  return pairs.reduce<string[]>((acc, pair) => [...acc, pair.to], []);
}

function filterAvailableFromAssets(pairs: Pair[], allAccounts: AccountLike[]) {
  if (pairs === null || pairs === undefined) return [];

  return flattenAccounts(allAccounts).map(account => {
    const id = getAccountCurrency(account).id;
    const isAccountAvailable = !!pairs.find(pair => pair.from === id);
    return { ...account, disabled: !isAccountAvailable };
  });
}

// Put disabled accounts and subaccounts at the bottom of the list while preserving the parent/children position.
export function sortAccountsByStatus(
  accounts: (Account & { disabled: boolean })[],
) {
  let activeAccounts: (Account & { disabled: boolean })[] = [];
  let disabledAccounts: (Account & { disabled: boolean })[] = [];
  let subAccounts = [];
  let disabledSubAccounts = [];

  // Traverse the accounts in reverse to check disabled accounts with active subAccounts
  for (let i = accounts.length - 1; i >= 0; i--) {
    const account = accounts[i];

    // Handle Account type first
    if (account.type === "Account") {
      if (account.disabled && !subAccounts.length) {
        // When a disabled account has no active subAccount, add it to the disabledAccounts
        disabledAccounts = [
          account,
          ...disabledSubAccounts,
          ...disabledAccounts,
        ];
      } else {
        // When an account has at least an active subAccount, add it to the activeAccounts
        activeAccounts = [
          account,
          ...subAccounts,
          ...disabledSubAccounts,
          ...activeAccounts,
        ];
      }

      // Clear subAccounts
      subAccounts = [];
      disabledSubAccounts = [];
    } else if (account.disabled) {
      // Add TokenAccount and ChildAccount to the subAccounts arrays
      disabledSubAccounts.unshift(account);
    } else {
      subAccounts.unshift(account);
    }
  }

  return [...activeAccounts, ...disabledAccounts];
}

export const fromSelector = createSelector(pairsSelector, pairs =>
  memoize((allAccounts: Account[]) =>
    sortAccountsByStatus(filterAvailableFromAssets(pairs, allAccounts)),
  ),
);
