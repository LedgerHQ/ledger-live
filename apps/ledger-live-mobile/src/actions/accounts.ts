import {
  AccountComparator,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/lib/account/index";
import { Dispatch } from "redux";
import { implicitMigration } from "@ledgerhq/live-common/migrations/accounts";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import accountModel from "../logic/accountModel";

export const importStore = (state: { active: { data: AccountRaw[] } }) => ({
  type: "ACCOUNTS_IMPORT",
  payload: {
    state: {
      active:
        state && Array.isArray(state.active)
          ? implicitMigration(state.active.map(accountModel.decode))
          : [],
    },
  },
});
export const reorderAccounts =
  (comparator: AccountComparator) => (dispatch: Dispatch) =>
    dispatch({
      type: "REORDER_ACCOUNTS",
      payload: {
        comparator,
      },
    });
export const importAccounts = (input: ImportAccountsReduceInput) => ({
  type: "ACCOUNTS_USER_IMPORT",
  payload: { input },
});
export const replaceAccounts = (payload: {
  scannedAccounts: Account[];
  selectedIds: string[];
  renamings: Record<string, string>;
}) => ({
  type: "ACCOUNTS_ADD",
  payload,
});
export const setAccounts = (accounts: Account[]) => ({
  type: "ACCOUNTS_IMPORT",
  payload: {
    state: {
      active: accounts,
    },
  },
});
export type UpdateAccountWithUpdater = (
  accountId: string,
  arg1: (arg0: Account) => Account,
) => {
  type: "UPDATE_ACCOUNT";
  payload: {
    accountId: string;
    updater: (arg0: Account) => Account;
  };
};

export const updateAccountWithUpdater: UpdateAccountWithUpdater = (
  accountId,
  updater,
) => ({
  type: "UPDATE_ACCOUNT",
  payload: {
    accountId,
    updater,
  },
});
export type UpdateAccount = (_: Pick<Account, "id"> & Partial<Account>) => any;
export const updateAccount: UpdateAccount = payload =>
  updateAccountWithUpdater(payload.id, (account: Account) => ({
    ...account,
    ...payload,
  }));
export type DeleteAccount = (_: Account) => {
  type: string;
  payload: Account;
};
export const deleteAccount: DeleteAccount = payload => ({
  type: "DELETE_ACCOUNT",
  payload,
});
