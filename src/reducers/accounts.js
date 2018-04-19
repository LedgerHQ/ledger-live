// @flow
import { handleActions } from "redux-actions";
import { createSelector, createStructuredSelector } from "reselect";
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

export function accountsSelector(state: {
  accounts: AccountsState
}): Account[] {
  return state.accounts;
}

export const archivedAccountsSelector = createSelector(
  accountsSelector,
  accounts => accounts.filter(acc => acc.archived)
);

export const visibleAccountsSelector = createSelector(
  accountsSelector,
  accounts => accounts.filter(acc => !acc.archived)
);

export const currenciesSelector = createSelector(
  visibleAccountsSelector,
  accounts =>
    [...new Set(accounts.map(a => a.currency))].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
);

// TODO move to the (state, props) style https://github.com/reactjs/reselect#accessing-react-props-in-selectors
export function accountByIdSelector(
  state: { accounts: AccountsState },
  id: string
): ?Account {
  return accountsSelector(state).find(account => account.id === id);
}

export const accountSelector = createSelector(
  accountsSelector,
  (_, { accountId }: { accountId: string }) => accountId,
  (accounts, accountId) => accounts.find(a => a.id === accountId)
);

export const operationSelector = createSelector(
  accountSelector,
  (_, { operationId }: { operationId: string }) => operationId,
  (account, operationId) =>
    account && account.operations.find(o => o.id === operationId)
);

export const operationAndAccountSelector = createStructuredSelector({
  account: accountSelector,
  operation: operationSelector
});

export default handleActions(handlers, state);
