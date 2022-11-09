import {
  AccountComparator,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/account/index";
import { implicitMigration } from "@ledgerhq/live-common/migrations/accounts";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { Dispatch } from "redux";
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

const version = 0; // FIXME this needs to come from user data

const importStoreAction = createAction<AccountsImportStorePayload>(
  AccountsActionTypes.ACCOUNTS_IMPORT,
);
export const importStore = (rawAccounts: { active: { data: AccountRaw }[] }) =>
  importStoreAction({
    active:
      rawAccounts && Array.isArray(rawAccounts.active)
        ? implicitMigration(
            rawAccounts.active.map(({ data }) =>
              accountModel.decode({ data, version }),
            ),
          )
        : [],
  });

const reorderAccountsAction = createAction<AccountsReorderPayload>(
  AccountsActionTypes.REORDER_ACCOUNTS,
);
export const reorderAccounts =
  (comparator: AccountComparator) => (dispatch: Dispatch) =>
    dispatch(
      reorderAccountsAction({
        comparator,
      }),
    );

const importAccountsAction = createAction<AccountsImportAccountsPayload>(
  AccountsActionTypes.ACCOUNTS_USER_IMPORT,
);
export const importAccounts = (input: ImportAccountsReduceInput) =>
  importAccountsAction({
    input,
  });

const replaceAccountsAction = createAction<AccountsReplaceAccountsPayload>(
  AccountsActionTypes.ACCOUNTS_ADD,
);
export const replaceAccounts = (payload: {
  scannedAccounts: Account[];
  selectedIds: string[];
  renamings: Record<string, string>;
}) =>
  replaceAccountsAction({
    ...payload,
  });

const setAccountsAction = createAction<AccountsSetAccountsPayload>(
  AccountsActionTypes.SET_ACCOUNTS,
);
export const setAccounts = (accounts: Account[]) =>
  setAccountsAction({
    active: accounts,
  });

const updateAccountWithUpdaterAction =
  createAction<AccountsUpdateAccountWithUpdaterPayload>(
    AccountsActionTypes.UPDATE_ACCOUNT,
  );
export const updateAccountWithUpdater = (
  accountId: string,
  updater: (arg0: Account) => Account,
) =>
  updateAccountWithUpdaterAction({
    accountId,
    updater,
  });

export const updateAccount = (
  payload: Pick<Account, "id"> & Partial<Account>,
) =>
  updateAccountWithUpdater(payload.id, (account: Account) => ({
    ...account,
    ...payload,
  }));

const deleteAccountAction = createAction<AccountsDeleteAccountPayload>(
  AccountsActionTypes.DELETE_ACCOUNT,
);
export const deleteAccount = (account: Account) =>
  deleteAccountAction({ account });

const cleanCacheAction = createAction(AccountsActionTypes.CLEAN_CACHE);
export const cleanCache = () => cleanCacheAction();
