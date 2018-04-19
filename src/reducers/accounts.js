// @flow
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import { createAccountModel } from "@ledgerhq/wallet-common/lib/models/account";
import type { Account } from "@ledgerhq/wallet-common/lib/types";

export const accountModel = createAccountModel();

export type AccountsState = Account[];

const state: AccountsState = [];

const handlers: Object = {
  SET_ACCOUNTS: (
    state: AccountsState,
    { payload: accounts }: { payload: Account[] }
  ): AccountsState => accounts,

  ADD_ACCOUNT: (
    state: AccountsState,
    { payload: account }: { payload: Account }
  ): AccountsState => [...state, account],

  UPDATE_ACCOUNT: (
    state: AccountsState,
    { payload: account }: { payload: Account }
  ): AccountsState =>
    state.map(existingAccount => {
      if (existingAccount.id !== account.id) {
        return existingAccount;
      }

      const updatedAccount = {
        ...existingAccount,
        ...account
      };

      return updatedAccount;
    }),

  REMOVE_ACCOUNT: (
    state: AccountsState,
    { payload: account }: { payload: Account }
  ) => state.filter(acc => acc.id !== account.id)
};

// Selectors

export function getAccounts(state: { accounts: AccountsState }): Account[] {
  return state.accounts;
}

export const getArchivedAccounts = createSelector(getAccounts, accounts =>
  accounts.filter(acc => acc.archived)
);

export const getVisibleAccounts = createSelector(getAccounts, accounts =>
  accounts.filter(acc => !acc.archived)
);

export const currenciesSelector = createSelector(
  getVisibleAccounts,
  accounts =>
    [...new Set(accounts.map(a => a.currency))].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
);

// TODO move to the (state, props) style https://github.com/reactjs/reselect#accessing-react-props-in-selectors
export function getAccountById(
  state: { accounts: AccountsState },
  id: string
): ?Account {
  return getAccounts(state).find(account => account.id === id);
}

export default handleActions(handlers, state);
