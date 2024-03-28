/**
 * This exports all the logic related to the Wallet store.
 * The Wallet store is a store that contains the user data related to accounts.
 * It essentially is the whole user's wallet.
 */
import { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { getDefaultAccountName } from "./accountName";

export type WalletState = {
  // user's name for each account id
  accountNames: Map<string, string>;

  // a set of all the account ids that are starred (NB: token accounts can also be starred)
  starredAccountIds: Set<string>;
};

export const initialState: WalletState = {
  accountNames: new Map(),
  starredAccountIds: new Set(),
};

export type HandlersPayloads = {
  INIT_ACCOUNTS: { accounts: Account[]; accountsUserData: AccountUserData[] };
  SET_ACCOUNT_NAME: { accountId: string; name: string };
  SET_ACCOUNT_STARRED: { accountId: string; starred: boolean };
  // FIXME hack: we currently listen on this old one.
  // next, we need to rework 'addAccounts' live-common logic to split the Account away from the AccountUserData
  REPLACE_ACCOUNTS: Account[];
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
    return { accountNames, starredAccountIds };
  },
  SET_ACCOUNT_NAME: (state, { payload: { accountId, name } }) => {
    const accountNames = new Map(state.accountNames);
    accountNames.set(accountId, name);
    return { ...state, accountNames };
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
  // FIXME temporary implementation. this will be reworked during the addAccounts rework.
  // since the source of trust will be reversed as we will not extract out the name/starred from Account anymore
  // so we will need another way to add accountUserData in context of add accounts
  REPLACE_ACCOUNTS: (state, { payload }) => {
    const accountNames = new Map();
    const starredAccountIds = new Set<string>();
    payload.forEach(a => {
      accountNames.set(a.id, a.name);
      if (a.starred) {
        starredAccountIds.add(a.id);
      }
      for (const t of a.subAccounts || []) {
        if (t.starred) {
          starredAccountIds.add(t.id);
        }
      }
    });
    return { accountNames, starredAccountIds };
  },
};

// actions

export const setAccountName = (accountId: string, name: string) => ({
  type: "SET_ACCOUNT_NAME",
  payload: { accountId, name },
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
  const { id, name } = raw;
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
