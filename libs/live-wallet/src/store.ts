/**
 * This exports all the logic related to the Wallet store.
 * The Wallet store is a store that contains the user data related to accounts.
 * It essentially is the whole user's wallet.
 */
import { Account, AccountLike, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { getDefaultAccountName, getDefaultAccountNameForCurrencyIndex } from "./accountName";
import { AddAccountsAction } from "./addAccounts";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { AccountDescriptor } from "./cloudsync/datatypes/live";
import type { WalletSyncAccountsUpdate, WalletSyncDiff, WalletSyncState } from "./cloudsync/state";

export type WalletState = {
  // user's customized name for each account id
  accountNames: Map<string, string>;

  // a set of all the account ids that are starred (NB: token accounts can also be starred)
  starredAccountIds: Set<string>;

  /////
  // FIXME this part of the state is not correctly saved/restored at the moment, we need to improve the INIT_ACCOUNTS to include these data!

  // local copy of the wallet sync data last synchronized with the backend of wallet sync, in order to be able to diff what we need to do when we apply an incremental update
  wsState: WalletSyncState;

  // list of account ids that are not imported in the wallet sync data, because we need to be able to retry them later. possibly on startup.
  wsStateNonImportedAccountIds: string[];
};

export const initialState: WalletState = {
  accountNames: new Map(),
  starredAccountIds: new Set(),
  wsState: { data: null, version: 0 },
  wsStateNonImportedAccountIds: [],
};

export enum WalletHandlerType {
  INIT_ACCOUNTS = "INIT_ACCOUNTS",
  SET_ACCOUNT_NAME = "SET_ACCOUNT_NAME",
  SET_ACCOUNT_STARRED = "SET_ACCOUNT_STARRED",
  BULK_SET_ACCOUNT_NAMES = "BULK_SET_ACCOUNT_NAMES",
  ADD_ACCOUNTS = "ADD_ACCOUNTS",
  WALLET_SYNC_UPDATE = "WALLET_SYNC_UPDATE",
}

export type HandlersPayloads = {
  INIT_ACCOUNTS: { accounts: Account[]; accountsUserData: AccountUserData[] };
  SET_ACCOUNT_NAME: { accountId: string; name: string };
  BULK_SET_ACCOUNT_NAMES: { accountNames: Map<string, string> };
  SET_ACCOUNT_STARRED: { accountId: string; starred: boolean };
  ADD_ACCOUNTS: AddAccountsAction["payload"];
  WALLET_SYNC_UPDATE: WalletSyncAccountsUpdate;
};

type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type WalletHandlers<PreciseKey = true> = Handlers<WalletState, HandlersPayloads, PreciseKey>;

export const handlers: WalletHandlers = {
  INIT_ACCOUNTS: (_, { payload: { accountsUserData } }): WalletState => {
    const accountNames = new Map();
    const starredAccountIds = new Set<string>();
    accountsUserData.forEach(accountUserData => {
      accountNames.set(accountUserData.id, accountUserData.name);
      for (const starredId of accountUserData.starredIds) {
        starredAccountIds.add(starredId);
      }
    });
    return {
      accountNames,
      starredAccountIds,
      wsState: { data: null, version: 0 },
      wsStateNonImportedAccountIds: [],
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
      const name =
        editedNames.get(account.id) ||
        accountNames.get(account.id) ||
        getDefaultAccountName(account);
      accountNames.set(account.id, name);
    }
    return { ...state, accountNames };
  },
  WALLET_SYNC_UPDATE: (
    state,
    {
      payload: {
        newNamesState,
        failures,
        newState: { data, version },
      },
    },
  ) => {
    const wsStateNonImportedAccountIds = Object.keys(failures);
    return {
      ...state,
      accountNames: newNamesState,
      wsStateNonImportedAccountIds,
      wsState: { data, version },
    };
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
 * assuming local is up to date with wallet sync, we infer what could possibly be a new update to push.
 */
export function inferLocalToDistantDiff(
  // accounts as they are in the global store
  localAccounts: Account[],
  // current local store
  walletState: WalletState,
): WalletSyncDiff {
  let hasChanges = false;
  const newNamesState = walletState.accountNames;
  const currentState = walletState.wsState;

  // check if the local accountNames have additions with upstream
  if (currentState.data) {
    const names = currentState.data.accountNames;
    for (const [id, name] of newNamesState) {
      if (names[id] !== name) {
        hasChanges = true;
        break;
      }
    }
  }

  // let's figure out the new local accounts
  const added: AccountDescriptor[] = [];
  const distantServerAccountIds = new Set<string>(currentState.data?.accounts.map(a => a.id) || []);
  for (const account of localAccounts) {
    const id = account.id;
    if (!distantServerAccountIds.has(id)) {
      added.push({
        id,
        currencyId: account.currency.id,
        freshAddress: account.freshAddress,
        seedIdentifier: account.seedIdentifier,
        derivationMode: account.derivationMode,
        index: account.index,
      });
      hasChanges = true;
    }
  }

  // let's figure out the locally deleted accounts that we will need to take into account
  const removed: string[] = [];
  const localAccountIds = new Set(localAccounts.map(a => a.id));
  for (const id of distantServerAccountIds) {
    if (!localAccountIds.has(id)) {
      removed.push(id);
      hasChanges = true;
    }
  }

  let newState = currentState;

  if (hasChanges) {
    // we can now build the new state. we apply the diff on top of the previous state
    const accounts: AccountDescriptor[] = [...added];
    for (const account of currentState.data?.accounts || []) {
      if (removed.includes(account.id)) {
        continue;
      }
      accounts.push(account);
    }
    const accountNames = Object.fromEntries(newNamesState);
    newState = {
      // spread the rest of the data we don't know, because we may receive data from a future version that handles it.
      // however, the problem will be in the diff: if we didn't had the data before and we obtain it, we need to consider it a full diff apply. but then in order to be able to diff null->field we may need to know the partial data vs last pulled data.
      data: { ...currentState.data, accounts, accountNames },
      version: currentState.version + 1,
    };
  }
  return {
    currentState,
    newState,
    added,
    removed,
    newNamesState,
    hasChanges,
  };
}
