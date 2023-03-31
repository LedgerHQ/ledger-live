import { Dispatch } from "redux";

import { Account, SubAccount } from "@ledgerhq/types-live";
import { AccountComparator } from "@ledgerhq/live-common/account/ordering";
import { implicitMigration } from "@ledgerhq/live-common/migrations/accounts";
import { getKey } from "~/renderer/storage";

export const replaceAccounts = (payload: Account[]) => ({
  type: "DB:REPLACE_ACCOUNTS",
  payload,
});

export const addAccount = (payload: Account) => ({
  type: "DB:ADD_ACCOUNT",
  payload,
});

export const removeAccount = (payload: Account) => ({
  type: "DB:REMOVE_ACCOUNT",
  payload,
});

export const setAccounts = (payload: Account[]) => ({
  type: "SET_ACCOUNTS",
  payload,
});

export const reorderAccounts = (comparator: AccountComparator) => (dispatch: Dispatch) =>
  dispatch({
    type: "DB:REORDER_ACCOUNTS",
    payload: { comparator },
  });

export const fetchAccounts = () => async (dispatch: Dispatch) => {
  const accounts = implicitMigration(await getKey("app", "accounts", []));
  return dispatch({
    type: "SET_ACCOUNTS",
    payload: accounts,
  });
};

type UpdateAccountAction = {
  type: string;
  payload: { updater: (account: Account) => Account; accountId?: string };
};

export type UpdateAccountWithUpdater = (
  accountId: string,
  updater: (account: Account) => Account,
) => UpdateAccountAction;

export const updateAccountWithUpdater: UpdateAccountWithUpdater = (accountId, updater) => ({
  type: "DB:UPDATE_ACCOUNT",
  payload: { accountId, updater },
});

export type UpdateAccount = (account: Partial<Account>) => UpdateAccountAction;
export const updateAccount: UpdateAccount = payload => ({
  type: "DB:UPDATE_ACCOUNT",
  payload: {
    updater: (account: Account) => ({ ...account, ...payload }),
    accountId: payload.id,
  },
});

export const toggleStarAction = (id: string, parentId?: string): UpdateAccountAction => {
  return {
    type: "DB:UPDATE_ACCOUNT",
    payload: {
      updater: (account: Account) => {
        if (parentId && account.subAccounts) {
          const subAccounts: SubAccount[] = account.subAccounts.map(sa =>
            sa.id === id ? { ...sa, starred: !sa.starred } : sa,
          );
          return { ...account, subAccounts };
        }
        return { ...account, starred: !account.starred };
      },
      accountId: parentId || id,
    },
  };
};

export const cleanAccountsCache = () => ({ type: "DB:CLEAN_ACCOUNTS_CACHE" });
export const cleanFullNodeDisconnect = () => ({
  type: "DB:CLEAN_FULLNODE_DISCONNECT",
});
