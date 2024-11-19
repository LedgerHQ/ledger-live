/**
 * This exports all the logic related to the Wallet store.
 * The Wallet store is a store that contains the user data related to accounts.
 * It essentially is the whole user's wallet.
 */
import { Account, AccountLike, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { getDefaultAccountName, getDefaultAccountNameForCurrencyIndex } from "./accountName";
import { AddAccountsAction } from "./addAccounts";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { DistantState } from "./walletsync";
import { NonImportedAccountInfo } from "./walletsync/modules/accounts";

export type WSState = {
  data: DistantState | null;
  version: number;
};

export type WalletState = {
  // user's customized name for each account id
  accountNames: Map<string, string>;

  // a set of all the account ids that are starred (NB: token accounts can also be starred)
  starredAccountIds: Set<string>;

  nonImportedAccountInfos: NonImportedAccountInfo[];

  // local copy of the wallet sync data last synchronized with the backend of wallet sync, in order to be able to diff what we need to do when we apply an incremental update
  walletSyncState: WSState;
};

export type ExportedWalletState = {
  walletSyncState: WSState;
  nonImportedAccountInfos: NonImportedAccountInfo[];
};

export const initialState: WalletState = {
  accountNames: new Map(),
  starredAccountIds: new Set(),
  nonImportedAccountInfos: [],
  walletSyncState: { data: null, version: 0 },
};

export enum WalletHandlerType {
  INIT_ACCOUNTS = "INIT_ACCOUNTS",
  SET_ACCOUNT_NAME = "SET_ACCOUNT_NAME",
  SET_ACCOUNT_STARRED = "SET_ACCOUNT_STARRED",
  BULK_SET_ACCOUNT_NAMES = "BULK_SET_ACCOUNT_NAMES",
  ADD_ACCOUNTS = "ADD_ACCOUNTS",
  WALLET_SYNC_UPDATE = "WALLET_SYNC_UPDATE",
  IMPORT_WALLET_SYNC = "IMPORT_WALLET_SYNC",
  SET_NON_IMPORTED_ACCOUNTS = "SET_NON_IMPORTED_ACCOUNTS",
}

export type HandlersPayloads = {
  INIT_ACCOUNTS: { accounts: Account[]; accountsUserData: AccountUserData[] };
  SET_ACCOUNT_NAME: { accountId: string; name: string };
  BULK_SET_ACCOUNT_NAMES: { accountNames: Map<string, string> };
  SET_ACCOUNT_STARRED: { accountId: string; starred: boolean };
  ADD_ACCOUNTS: AddAccountsAction["payload"];
  WALLET_SYNC_UPDATE: {
    data: DistantState | null;
    version: number;
  };
  IMPORT_WALLET_SYNC: Partial<ExportedWalletState>;
  SET_NON_IMPORTED_ACCOUNTS: NonImportedAccountInfo[];
};

type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type WalletHandlers<PreciseKey = true> = Handlers<WalletState, HandlersPayloads, PreciseKey>;

export const handlers: WalletHandlers = {
  INIT_ACCOUNTS: (state, { payload: { accountsUserData } }): WalletState => {
    const accountNames = new Map();
    const starredAccountIds = new Set<string>();
    accountsUserData.forEach(accountUserData => {
      if (accountUserData.name) {
        accountNames.set(accountUserData.id, accountUserData.name);
      }
      for (const starredId of accountUserData.starredIds) {
        starredAccountIds.add(starredId);
      }
    });
    return {
      ...state,
      accountNames,
      starredAccountIds,
    };
  },
  SET_ACCOUNT_NAME: (state, { payload: { accountId, name } }) => {
    const accountNames = new Map(state.accountNames);
    if (!name) {
      accountNames.delete(accountId);
    } else {
      accountNames.set(accountId, name);
    }
    return { ...state, accountNames };
  },
  BULK_SET_ACCOUNT_NAMES: (state, { payload: { accountNames } }) => {
    // merge the new account names with the existing ones
    const newAccountNames = new Map(state.accountNames);
    for (const [accountId, name] of accountNames) {
      newAccountNames.set(accountId, name);
    }
    return { ...state, accountNames: newAccountNames };
  },
  SET_ACCOUNT_STARRED: (state, { payload: { accountId, starred: value } }) => {
    const starredAccountIds = new Set(state.starredAccountIds);
    if (value) {
      starredAccountIds.add(accountId);
    } else {
      starredAccountIds.delete(accountId);
    }
    return { ...state, starredAccountIds };
  },
  ADD_ACCOUNTS: (state, { payload: { allAccounts, editedNames } }) => {
    const accountNames = new Map(state.accountNames);
    for (const account of allAccounts) {
      const name = editedNames.get(account.id) || accountNames.get(account.id);
      if (name && name !== getDefaultAccountName(account)) {
        accountNames.set(account.id, name);
      }
    }
    return { ...state, accountNames };
  },
  WALLET_SYNC_UPDATE: (state, { payload }) => {
    return { ...state, walletSyncState: payload };
  },
  IMPORT_WALLET_SYNC: (state, { payload }) => {
    return {
      ...state,
      ...payload,
    };
  },
  SET_NON_IMPORTED_ACCOUNTS: (state, { payload }) => {
    return { ...state, nonImportedAccountInfos: payload };
  },
};

// actions

export const setAccountName = (accountId: string, name: string) => ({
  type: "SET_ACCOUNT_NAME",
  payload: { accountId, name },
});

export const setAccountNames = (accountNames: Map<string, string>) => ({
  type: "BULK_SET_ACCOUNT_NAMES",
  payload: { accountNames },
});

export const setAccountStarred = (accountId: string, starred: boolean) => ({
  type: "SET_ACCOUNT_STARRED",
  payload: { accountId, starred },
});

export const initAccounts = (accounts: Account[], accountsUserData: AccountUserData[]) => ({
  type: "INIT_ACCOUNTS",
  payload: { accounts, accountsUserData },
});

/**
 * action to import back the wallet state. opposite of exportWalletState
 */
export const importWalletState = (payload: Partial<ExportedWalletState>) => ({
  type: "IMPORT_WALLET_SYNC",
  payload,
});

export const walletSyncUpdate = (data: DistantState | null, version: number) => ({
  type: "WALLET_SYNC_UPDATE",
  payload: { data, version },
});

export const setNonImportedAccounts = (payload: NonImportedAccountInfo[]) => ({
  type: "SET_NON_IMPORTED_ACCOUNTS",
  payload,
});

// Local Selectors

export const accountNameSelector = (
  state: WalletState,
  { accountId }: { accountId: string },
): string | undefined => state.accountNames.get(accountId);

export const accountNameWithDefaultSelector = (state: WalletState, account: AccountLike): string =>
  state.accountNames.get(account.id) || getDefaultAccountName(account);

export const isStarredAccountSelector = (
  state: WalletState,
  { accountId }: { accountId: string },
): boolean => state.starredAccountIds.has(accountId);

/**
 * Recreate an AccountUserData from the store.
 * it is used to transport all data related to a main account.
 * but the data isn't used internally for performance reason.
 */
export const accountUserDataExportSelector = (
  state: WalletState,
  { account }: { account: Account },
): AccountUserData => {
  const id = account.id;
  const name = state.accountNames.get(id) || getDefaultAccountName(account);
  const starredIds = [];
  if (state.starredAccountIds.has(id)) {
    starredIds.push(id);
  }
  for (const t of account.subAccounts || []) {
    if (state.starredAccountIds.has(t.id)) {
      starredIds.push(t.id);
    }
  }
  return { id, name, starredIds };
};

export const accountRawToAccountUserData = (raw: AccountRaw): AccountUserData => {
  const { id } = raw;
  const name =
    raw.name ||
    getDefaultAccountNameForCurrencyIndex({
      currency: getCryptoCurrencyById(raw.currencyId),
      index: raw.index,
    });
  const starredIds = [];
  if (raw.starred) {
    starredIds.push(raw.id);
  }
  for (const t of raw.subAccounts || []) {
    if (t.starred) {
      starredIds.push(t.id);
    }
  }
  return { id, name, starredIds };
};

/**
 * call this selector to save the store state
 */
export const exportWalletState = (state: WalletState): ExportedWalletState => ({
  walletSyncState: state.walletSyncState,
  nonImportedAccountInfos: state.nonImportedAccountInfos,
});

export const walletStateExportShouldDiffer = (a: WalletState, b: WalletState): boolean => {
  return (
    a.walletSyncState !== b.walletSyncState ||
    a.nonImportedAccountInfos !== b.nonImportedAccountInfos
  );
};

export const walletSyncStateSelector = (state: WalletState): WSState => state.walletSyncState;
