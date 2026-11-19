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
import { initStarredFromIds } from "@domain/entity-starred-account";
import type { Dispatch, UnknownAction } from "redux";

const version = 0; // FIXME this needs to come from user data

/** The actions that load decoded accounts: unsupported accounts are dropped, as before. */
export function initAccountsActions(
  tuples: ReadonlyArray<[Account, AccountUserData]>,
): UnknownAction[] {
  const supported = tuples.filter(([account]) => {
    const error = checkAccountSupported(account);
    if (!error) return true;
    console.warn(`dropping an account of ${account.currency.id}: ${error.message}`);
    return false;
  });

  const accounts = supported.map(([account]) => account);
  const accountsUserData = supported
    .filter(([account, userData]) => userData.name !== getDefaultAccountName(account))
    .map(([, userData]) => userData);
  return [
    { type: "INIT_ACCOUNTS", payload: { accounts, accountsUserData } },
    initFromUserData(accountsUserData.map(({ id, name }) => ({ id, name }))),
    initStarredFromIds(supported.flatMap(([, userData]) => userData.starredIds)),
  ];
}

export const importStore = async (rawAccounts: { active: { data: AccountRaw }[] }) => {
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

  const actions = initAccountsActions(tuples);
  return (dispatch: Dispatch) => {
    actions.forEach(action => dispatch(action));
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
