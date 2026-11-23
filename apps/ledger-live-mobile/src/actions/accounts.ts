import type { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { createAction } from "redux-actions";
import accountModel from "../logic/accountModel";
import type {
  AccountsDeleteAccountPayload,
  AccountsReorderPayload,
  AccountsReplacePayload,
  AccountsUpdateAccountWithUpdaterPayload,
} from "./types";
import { AccountsActionTypes } from "./types";
import logger from "../logger";
import { getDefaultAccountName, initFromUserData } from "@domain/entity-account-name";
import { checkAccountSupported } from "@ledgerhq/live-common/account/index";
import type { Dispatch } from "redux";

type StoredAccount = { data: AccountRaw; version?: number };

const LEGACY_UNKNOWN_VERSION = 1;

function migrationVersionOf({ version }: StoredAccount): number {
  if (version === undefined || version === LEGACY_UNKNOWN_VERSION) return 0;
  return version;
}

export const importStore = async (rawAccounts: { active: StoredAccount[] }) => {
  const decodePromises: Array<Promise<[Account, AccountUserData] | null>> = [];

  if (rawAccounts && Array.isArray(rawAccounts.active)) {
    for (const storedAccount of rawAccounts.active) {
      const { data } = storedAccount;
      decodePromises.push(
        accountModel.decode({ data, version: migrationVersionOf(storedAccount) }).catch(error => {
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

  const supported = tuples.filter(([account]) => {
    const error = checkAccountSupported(account);
    if (!error) return true;
    console.warn(`dropping account ${account.id}: ${error.message}`);
    return false;
  });

  const accounts = supported.map(([account]) => account);
  const accountsUserData = supported
    .filter(([account, userData]) => userData.name !== getDefaultAccountName(account))
    .map(([, userData]) => userData);
  return (dispatch: Dispatch) => {
    dispatch({
      type: "INIT_ACCOUNTS",
      payload: { accounts, accountsUserData },
    });
    dispatch(initFromUserData(accountsUserData.map(({ id, name }) => ({ id, name }))));
  };
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
