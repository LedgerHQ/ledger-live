// @flow

import { implicitMigration } from "@ledgerhq/live-common/lib/migrations/accounts";
import type { Account } from "@ledgerhq/live-common/lib/types";
import accountModel from "../logic/accountModel";

export const importStore = (state: *) => ({
  type: "ACCOUNTS_IMPORT",
  state: {
    active:
      state && Array.isArray(state.active)
        ? implicitMigration(state.active.map(accountModel.decode))
        : [],
  },
});
export const reorderAccounts = (comparator: *) => (dispatch: *) =>
  dispatch({
    type: "REORDER_ACCOUNTS",
    payload: { comparator },
  });

export const importAccounts = ({
  items,
  selectedAccounts,
}: {
  items: any[],
  selectedAccounts: string[],
}) => ({
  type: "ACCOUNTS_USER_IMPORT",
  items,
  selectedAccounts,
});

export const replaceAccounts = (payload: {
  scannedAccounts: Account[],
  selectedIds: string[],
  renamings: { [id: string]: string },
}) => ({
  type: "ACCOUNTS_ADD",
  ...payload,
});

export const setAccounts = (accounts: Account[]) => ({
  type: "ACCOUNTS_IMPORT",
  state: {
    active: accounts,
  },
});

export type UpdateAccountWithUpdater = (
  accountId: string,
  (Account) => Account,
) => *;

export const updateAccountWithUpdater: UpdateAccountWithUpdater = (
  accountId,
  updater,
) => ({
  type: "UPDATE_ACCOUNT",
  accountId,
  updater,
});

export type UpdateAccount = ($Shape<Account>) => *;
export const updateAccount: UpdateAccount = payload =>
  updateAccountWithUpdater(payload.id, (account: Account) => ({
    ...account,
    ...payload,
  }));

export type DeleteAccount = Account => { type: string, payload: Account };
export const deleteAccount: DeleteAccount = payload => ({
  type: "DELETE_ACCOUNT",
  payload,
});
