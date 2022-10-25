import { ImportAccountsReduceInput } from "@ledgerhq/live-common/account/index";
import { implicitMigration } from "@ledgerhq/live-common/migrations/accounts";
import type { Account } from "@ledgerhq/types-live";
import accountModel from "../logic/accountModel";

export const importStore = (state: any) => ({
  type: "ACCOUNTS_IMPORT",
  state: {
    active:
      state && Array.isArray(state.active)
        ? implicitMigration(state.active.map(accountModel.decode))
        : [],
  },
});
export const reorderAccounts = (comparator: any) => (dispatch: any) =>
  dispatch({
    type: "REORDER_ACCOUNTS",
    payload: {
      comparator,
    },
  });
export const importAccounts = (input: ImportAccountsReduceInput) => ({
  type: "ACCOUNTS_USER_IMPORT",
  input,
});
export const replaceAccounts = (payload: {
  scannedAccounts: Account[];
  selectedIds: string[];
  renamings: Record<string, string>;
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
  arg1: (arg0: Account) => Account,
) => never;

export const updateAccountWithUpdater: UpdateAccountWithUpdater = (
  accountId,
  updater,
) => ({
  type: "UPDATE_ACCOUNT",
  accountId,
  updater,
});
export type UpdateAccount = (_: $Shape<Account>) => any;
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
