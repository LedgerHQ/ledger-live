import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { flattenAccounts } from "@ledgerhq/live-common/account/helpers";
import { Transaction, UPDATE_PROVIDERS_TYPE } from "@ledgerhq/live-common/exchange/swap/types";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import memoize from "lodash/memoize";
import { createAction } from "redux-actions";
import { OutputSelector, createSelector } from "reselect";
import { State } from "~/renderer/reducers";
import { SwapStateType } from "~/renderer/reducers/swap";

/* ACTIONS */
export const updateProvidersAction = createAction<UPDATE_PROVIDERS_TYPE["payload"]>(
  "SWAP/UPDATE_PROVIDERS",
);
export const updateTransactionAction = createAction<Transaction | undefined | null["payload"]>(
  "SWAP/UPDATE_TRANSACTION",
);
export const updateRateAction = createAction<Transaction | undefined | null["exchangeRate"]>(
  "SWAP/UPDATE_RATE",
);
export const resetSwapAction = createAction("SWAP/RESET_STATE");

/* SELECTORS */
export const providersSelector: OutputSelector<
  State,
  void,
  SwapStateType["providers"]
> = createSelector(
  state => state.swap,
  swap => swap.providers,
);
export const filterAvailableToAssets = (pairs, fromId?: string) => {
  if (pairs === null || pairs === undefined) return null;
  const toAssets = [];
  for (const pair of pairs) {
    if (!fromId || pair.from === fromId) {
      toAssets.push(pair.to);
    }
  }
  return toAssets;
};
const filterAvailableFromAssets = (pairs, allAccounts) => {
  if (pairs === null || pairs === undefined) return [];
  return flattenAccounts(allAccounts).map(account => {
    const id = getAccountCurrency(account).id;
    const isAccountAvailable = !!pairs.find(pair => pair.from === id);
    return {
      ...account,
      disabled: !isAccountAvailable,
    };
  });
};
export const toSelector: OutputSelector<State, void, any> = createSelector(
  state => state.swap.pairs,
  pairs =>
    memoize((fromId?: "string") => {
      const filteredAssets = filterAvailableToAssets(pairs, fromId);
      const uniqueAssetList = [...new Set(filteredAssets)];
      return uniqueAssetList;
    }),
);

// Put disabled accounts and subaccounts at the bottom of the list while preserving the parent/children position.
export function sortAccountsByStatus(accounts: Account[]) {
  let activeAccounts = [];
  let disabledAccounts = [];
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
      // Add TokenAccount and ChildAccount to the subAccounts arrays
      if (account.disabled) {
        disabledSubAccounts.unshift(account);
      } else {
        subAccounts.unshift(account);
      }
    }
  }
  return [...activeAccounts, ...disabledAccounts];
}
export const fromSelector: OutputSelector<State, void, any> = createSelector(
  state => state.swap.pairs,
  pairs =>
    memoize(
      (allAccounts: Array<Account>): Array<Account | TokenAccount> =>
        sortAccountsByStatus(filterAvailableFromAssets(pairs, allAccounts)),
    ),
);
export const transactionSelector: OutputSelector<
  State,
  void,
  SwapStateType["transaction"]
> = createSelector(
  state => state.swap,
  swap => swap.transaction,
);
export const rateSelector: OutputSelector<
  State,
  void,
  SwapStateType["exchangeRate"]
> = createSelector(
  state => state.swap,
  swap => swap.exchangeRate,
);
export const rateExpirationSelector: OutputSelector<
  State,
  void,
  SwapStateType["exchangeRateExpiration"]
> = createSelector(
  state => state.swap,
  swap => swap.exchangeRateExpiration,
);
