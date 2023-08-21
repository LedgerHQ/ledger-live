import { implicitMigration } from "@ledgerhq/live-common/migrations/accounts";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { createAction } from "redux-actions";
import accountModel from "../logic/accountModel";
import type {
  AccountsDeleteAccountPayload,
  AccountsImportAccountsPayload,
  AccountsImportStorePayload,
  AccountsReorderPayload,
  AccountsReplaceAccountsPayload,
  AccountsSetAccountsPayload,
  AccountsUpdateAccountWithUpdaterPayload,
} from "./types";
import { AccountsActionTypes } from "./types";
import logger from "../logger";

const version = 0; // FIXME this needs to come from user data

const importStoreAction = createAction<AccountsImportStorePayload>(
  AccountsActionTypes.ACCOUNTS_IMPORT,
);
export const importStore = (rawAccounts: { active: { data: AccountRaw }[] }) => {
  const accounts = [];
  if (rawAccounts && Array.isArray(rawAccounts.active)) {
    for (const { data } of rawAccounts.active) {
      try {
        accounts.push(accountModel.decode({ data, version }));
      } catch (e) {
        if (e instanceof Error) logger.critical(e);
      }
    }
  }
  return importStoreAction(implicitMigration(accounts));
};
export const reorderAccounts = createAction<AccountsReorderPayload>(
  AccountsActionTypes.REORDER_ACCOUNTS,
);
export const importAccounts = createAction<AccountsImportAccountsPayload>(
  AccountsActionTypes.ACCOUNTS_USER_IMPORT,
);
export const replaceAccounts = createAction<AccountsReplaceAccountsPayload>(
  AccountsActionTypes.ACCOUNTS_ADD,
);
export const setAccounts = createAction<AccountsSetAccountsPayload>(
  AccountsActionTypes.SET_ACCOUNTS,
);
export const updateAccountWithUpdater = createAction<AccountsUpdateAccountWithUpdaterPayload>(
  AccountsActionTypes.UPDATE_ACCOUNT,
);
export const updateAccount = (payload: Pick<Account, "id"> & Partial<Account>) =>
  updateAccountWithUpdater({
    accountId: payload.id,
    updater: (account: Account) => ({
      ...account,
      ...payload,
    }),
  });
export const deleteAccount = createAction<AccountsDeleteAccountPayload>(
  AccountsActionTypes.DELETE_ACCOUNT,
);
export const cleanCache = createAction(AccountsActionTypes.CLEAN_CACHE);
