// @flow

import { handleActions } from "redux-actions";

import every from "lodash/every";
import get from "lodash/get";
import defaultsDeep from "lodash/defaultsDeep";
import { createAccountModel } from "@ledgerhq/wallet-common/lib/models/account";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import type { State } from ".";

export const accountModel = createAccountModel();

export type AccountsState = Account[];

const state: AccountsState = [];

function applyDefaults(account) {
  return defaultsDeep(account, {
    minConfirmations: 2
  });
}

const handlers: Object = {
  SET_ACCOUNTS: (
    state: AccountsState,
    { payload: accounts }: { payload: Account[] }
  ): AccountsState => accounts.map(applyDefaults),

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

export function getArchivedAccounts(state: {
  accounts: AccountsState
}): Account[] {
  return state.accounts.filter(acc => acc.archived === true);
}

export function getVisibleAccounts(state: {
  accounts: AccountsState
}): Account[] {
  return getAccounts(state).filter(account => account.archived !== true);
}

export function getAccountById(
  state: { accounts: AccountsState },
  id: string
): Account | null {
  const account = getAccounts(state).find(account => account.id === id);
  return account || null;
}

export function canCreateAccount(state: State): boolean {
  return every(getAccounts(state), a => get(a, "operations.length", 0) > 0);
}

export default handleActions(handlers, state);
