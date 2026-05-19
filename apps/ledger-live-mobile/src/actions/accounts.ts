import type { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { createAction } from "redux-actions";
import { UnknownAction } from "redux";
import accountModel from "../logic/accountModel";
import type {
  AccountsDeleteAccountPayload,
  AccountsReorderPayload,
  AccountsReplacePayload,
  AccountsUpdateAccountWithUpdaterPayload,
} from "./types";
import { AccountsActionTypes } from "./types";
import logger from "../logger";
import {
  addNonImportedAccounts,
  initAccounts,
  splitSupportedAccounts,
} from "@ledgerhq/live-wallet/store";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

const version = 0; // FIXME this needs to come from user data

export const importStore = async (
  rawAccounts: { active: { data: AccountRaw }[] },
): Promise<UnknownAction[]> => {
  const decodePromises: Array<Promise<[Account, AccountUserData] | null>> = [];

  if (rawAccounts && Array.isArray(rawAccounts.active)) {
    for (const { data } of rawAccounts.active) {
      decodePromises.push(
        accountModel.decode({ data, version }).catch(error => {
          if (error instanceof Error) {
            logger.critical(error);
            console.error(`Critical: Failed to decode account ${data.id}:`, error.message);
          }
          return null;
        }),
      );
    }
  }

  const tuples = (await Promise.all(decodePromises)).filter(
    (tuple): tuple is [Account, AccountUserData] => tuple !== null,
  );

  const { supported, dropped } = splitSupportedAccounts(tuples, (id, message) =>
    console.warn(`dropping account ${id}: ${message}`),
  );

  const accounts = supported.map(([account]) => account);
  const accountsUserData = supported
    .filter(([account, userData]) => userData.name !== getDefaultAccountName(account))
    .map(([, userData]) => userData);

  const actions: UnknownAction[] = [initAccounts(accounts, accountsUserData) as UnknownAction];
  if (dropped.length > 0) {
    actions.push(addNonImportedAccounts(dropped) as UnknownAction);
  }
  return actions;
};
export const reorderAccounts = createAction<AccountsReorderPayload>(
  AccountsActionTypes.REORDER_ACCOUNTS,
);
export const addOneAccount = createAction<Account>(AccountsActionTypes.ADD_ACCOUNT);

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

