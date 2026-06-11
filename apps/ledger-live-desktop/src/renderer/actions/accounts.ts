import { Account, AccountUserData } from "@ledgerhq/types-live";
import { AccountComparator } from "@ledgerhq/live-wallet/ordering";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getKey } from "~/renderer/storage";
import { PasswordIncorrectError } from "@ledgerhq/errors";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { checkAccountSupported } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import logger from "~/renderer/logger";
import { ThunkResult } from "./types";

export const removeAccount = (payload: Account) => ({
  type: "REMOVE_ACCOUNT",
  payload,
});

export const initAccounts = (data: [Account, AccountUserData][]) => {
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
  return {
    type: "INIT_ACCOUNTS",
    payload: {
      accounts,
      accountsUserData,
    },
  };
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
    const data = await getKey("app", "accounts", []);
    if (!data) throw new PasswordIncorrectError("app accounts seems to still be encrypted");
    dispatch(initAccounts(data));
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
