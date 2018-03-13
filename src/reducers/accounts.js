// @flow

import { handleActions } from "redux-actions";

import every from "lodash/every";
import get from "lodash/get";
import defaultsDeep from "lodash/defaultsDeep";
import { getCurrencyByCoinType } from "@ledgerhq/currencies";

import type { State } from ".";
import type { Account } from "../types/common";

export type AccountsState = Account[];

const state: AccountsState = [];

function orderAccountsTransactions(account: Account) {
  const { operations } = account;
  operations.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  return {
    ...account,
    operations
  };
}

function applyDefaults(account) {
  return defaultsDeep(account, {
    settings: {
      minConfirmations: 2
    }
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
  ): AccountsState => [...state, orderAccountsTransactions(account)],

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

      return orderAccountsTransactions(updatedAccount);
    }),

  REMOVE_ACCOUNT: (
    state: AccountsState,
    { payload: account }: { payload: Account }
  ) => state.filter(acc => acc.id !== account.id)
};

// Selectors

export function getBalanceHistoryUntilNow(
  account: Account,
  daysCount: number
): Array<{ date: Date, value: number }> {
  const history = [];
  let { balance } = account;
  let i = 0; // index of operation
  let t = new Date();
  history.unshift({ date: t, value: balance });
  t = new Date(t.getFullYear(), t.getMonth(), t.getDate()); // start of the day
  for (let d = 0; d < daysCount; d++) {
    // accumulate operations after time t
    while (
      i < account.operations.length &&
      new Date(account.operations[i].receivedAt) > t
    ) {
      balance -= account.operations[i].amount;
      i++;
    }
    history.unshift({ date: t, value: balance });
    t = new Date(t - 24 * 60 * 60 * 1000);
  }
  return history;
}

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

type AccountSerial = *;

export function serializeAccounts(accounts: Array<AccountSerial>): Account[] {
  return accounts.map((account, key) => {
    const a: Account = {
      id: account.id,
      address: account.address,
      archived: account.archived,
      balance: account.balance,
      coinType: account.coinType,
      currency: getCurrencyByCoinType(account.coinType),
      operations: [],
      name: account.name || `${key}`,
      unitIndex: account.unitIndex || 0
    };
    a.operations = account.operations.map(t => ({
      ...t,
      account: a
    }));
    return a;
  });
}

export function deserializeAccounts(accounts: Account[]): AccountSerial[] {
  return accounts.map(account => ({
    id: account.id,
    address: account.address,
    archived: account.archived,
    balance: account.balance,
    coinType: account.coinType,
    name: account.name,
    operations: account.operations.map(({ account: _acc, ...t }) => t),
    unitIndex: account.unitIndex
  }));
}

export default handleActions(handlers, state);
