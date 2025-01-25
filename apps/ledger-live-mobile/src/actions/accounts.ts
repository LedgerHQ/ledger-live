import type { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { createAction } from "redux-actions";
import accountModel from "../logic/accountModel";
import type {
  AccountsDeleteAccountPayload,
  AccountsImportAccountsPayload,
  AccountsReorderPayload,
  AccountsReplacePayload,
  AccountsUpdateAccountWithUpdaterPayload,
} from "./types";
import { AccountsActionTypes } from "./types";
import logger from "../logger";
import { initAccounts } from "@ledgerhq/live-wallet/store";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

const version = 0; // FIXME this needs to come from user data

export const importStore = (rawAccounts: { active: { data: AccountRaw }[] }) => {
  const tuples: Array<[Account, AccountUserData]> = [];
  if (rawAccounts && Array.isArray(rawAccounts.active)) {
    for (const { data } of rawAccounts.active) {
      try {
        tuples.push(accountModel.decode({ data, version }));
      } catch (e) {
        if (e instanceof Error) logger.critical(e);
      }
    }
  }
  const accounts = tuples.map(([account]) => account);
  const accountsUserData = tuples
    .filter(([account, userData]) => userData.name !== getDefaultAccountName(account))
    .map(([, userData]) => userData);
  return initAccounts(accounts, accountsUserData);
};
export const reorderAccounts = createAction<AccountsReorderPayload>(
  AccountsActionTypes.REORDER_ACCOUNTS,
);
export const addOneAccount = createAction<Account>(AccountsActionTypes.ADD_ACCOUNT);

export const importAccountsLiveQR = createAction<AccountsImportAccountsPayload>(
  AccountsActionTypes.ACCOUNTS_USER_IMPORT,
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
export const replaceAccounts = createAction<AccountsReplacePayload>(
  AccountsActionTypes.SET_ACCOUNTS,
);

export const cleanCache = createAction(AccountsActionTypes.CLEAN_CACHE);
