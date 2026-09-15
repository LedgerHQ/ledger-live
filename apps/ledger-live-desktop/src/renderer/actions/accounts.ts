import { Account, AccountUserData } from "@ledgerhq/types-live";
import { AccountComparator } from "@ledgerhq/live-common/account/ordering";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getKey } from "~/renderer/storage";
import { PasswordIncorrectError } from "@ledgerhq/live-common/errors";
import { getDefaultAccountName, initFromUserData } from "@domain/entity-account-name";
import { checkAccountSupported } from "@ledgerhq/live-common/account/index";
import { initStarredFromIds } from "@domain/entity-starred-account";
import { accountsSelector } from "~/renderer/reducers/accounts";
import logger from "~/renderer/logger";
import { ThunkResult } from "./types";

export const removeAccount = (payload: Account) => ({
  type: "REMOVE_ACCOUNT",
  payload,
});

export const initAccounts =
  (data: [Account, AccountUserData][]): ThunkResult =>
  dispatch => {
    const supported = data.filter(([account]) => {
      const error = checkAccountSupported(account);
      if (!error) return true;
      logger.warn(`dropping account ${account.id}: ${error.message}`);
      return false;
    });
    const accounts = supported.map(([account]) => account);
    const accountsUserData = supported
      .filter(([account, userData]) => userData.name !== getDefaultAccountName(account))
      .map(([, userData]) => userData);
    dispatch({
      type: "INIT_ACCOUNTS",
      payload: {
        accounts,
        accountsUserData,
      },
    });
    dispatch(initFromUserData(accountsUserData.map(({ id, name }) => ({ id, name }))));
    dispatch(initStarredFromIds(supported.flatMap(([, userData]) => userData.starredIds)));
  };

export const replaceAccounts = (accounts: Account[]) => ({
  type: "REPLACE_ACCOUNTS",
  payload: accounts,
});

export const reorderAccounts =
  (comparator: AccountComparator): ThunkResult =>
  (dispatch, _getState, _extra) =>
    dispatch({
      type: "REORDER_ACCOUNTS",
      payload: { comparator },
    });

export const fetchAccounts =
  (): ThunkResult<Promise<void>> => async (dispatch, _getState, _extra) => {
    const storedAccounts = await getKey("app", "accounts", []);
    if (storedAccounts.status === "encrypted") {
      throw new PasswordIncorrectError("app accounts seems to still be encrypted");
    }
    dispatch(initAccounts(storedAccounts.data ?? []));
  };

export type UpdateAccountAction = {
  type: string;
  payload: { updater: (account: Account) => Account; accountId?: string };
};

export type UpdateAccountWithUpdater = (
  accountId: string,
  updater: (account: Account) => Account,
) => UpdateAccountAction;

export const updateAccountWithUpdater: UpdateAccountWithUpdater = (accountId, updater) => ({
  type: "UPDATE_ACCOUNT",
  payload: { accountId, updater },
});

export type UpdateAccount = (account: Partial<Account>) => UpdateAccountAction;
export const updateAccount: UpdateAccount = payload => ({
  type: "UPDATE_ACCOUNT",
  payload: {
    updater: (account: Account) => ({ ...account, ...payload }),
    accountId: payload.id,
  },
});

export const cleanAccountsCache = (): ThunkResult<Promise<void>> => async (dispatch, getState) => {
  const accounts = accountsSelector(getState());
  const cleared = await Promise.all(
    accounts.map(async account => {
      const bridge = await getAccountBridge(account);
      return bridge.clearAccount(account);
    }),
  );
  dispatch(replaceAccounts(cleared));
};
