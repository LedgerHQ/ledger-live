import { createSelector, createSelectorCreator, lruMemoize } from "reselect";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Account, AccountUserData, AccountLike } from "@ledgerhq/types-live";
import {
  flattenAccounts,
  clearAccount,
  getAccountCurrency,
  isUpToDateAccount,
} from "@ledgerhq/live-common/account/index";
import { getEnv } from "@ledgerhq/live-env";
import isEqual from "lodash/isEqual";
import { State } from ".";
import { walletSelector } from "./wallet";
import { isStarredAccountSelector } from "@ledgerhq/live-wallet/store";
import { nestedSortAccounts, AccountComparator } from "@ledgerhq/live-wallet/ordering";
import { AddAccountsAction } from "@ledgerhq/live-wallet/addAccounts";

export type AccountsState = Account[];

const initialState: AccountsState = [];

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    reorderAccounts: (state, action: PayloadAction<{ comparator: AccountComparator }>) => {
      return nestedSortAccounts(state as Account[], action.payload.comparator);
    },
    initAccounts: (
      _state,
      action: PayloadAction<{ accounts: Account[]; accountsUserData: AccountUserData[] }>,
    ) => {
      return action.payload.accounts;
    },
    addAccounts: (_state, action: PayloadAction<AddAccountsAction["payload"]>) => {
      return action.payload.allAccounts;
    },
    updateAccount: (
      state,
      action: PayloadAction<{ accountId: string; updater: (a: Account) => Account }>,
    ) => {
      const { accountId, updater } = action.payload;
      return (state as Account[]).map(existingAccount => {
        if (existingAccount.id !== accountId) {
          return existingAccount;
        }
        return updater(existingAccount as Account);
      });
    },
    removeAccount: (state, action: PayloadAction<Account>) => {
      return (state as Account[]).filter(acc => acc.id !== action.payload.id);
    },
    cleanFullNodeDisconnect: state => {
      return (state as Account[]).filter(acc => acc.currency.id !== "bitcoin");
    },
    cleanAccountsCache: state => {
      return (state as Account[]).map(clearAccount);
    },
    replaceAccounts: (_state, action: PayloadAction<Account[]>) => {
      return action.payload;
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      (action): action is PayloadAction<AddAccountsAction["payload"]> =>
        action.type === "ADD_ACCOUNTS",
      (_state, action) => {
        return action.payload.allAccounts;
      },
    );
  },
});

export const {
  reorderAccounts,
  initAccounts,
  addAccounts,
  updateAccount,
  removeAccount,
  cleanFullNodeDisconnect,
  cleanAccountsCache,
  replaceAccounts,
} = accountsSlice.actions;

export default accountsSlice.reducer;

// Selectors

export const accountsSelector = (state: { accounts: AccountsState }): Account[] => state.accounts;

// NB some components don't need to refresh every time an account is updated, usually it's only
// when the balance/name/length/starred/swapHistory of accounts changes.
const accountHash = (a: AccountLike) => {
  const baseHash = `${a.id}-${a.balance.toString()}-swapHistory(${a.swapHistory?.length || "0"})`;
  // Include Canton-specific data in hash to ensure selector detects changes to cantonResources
  // Without this, when Canton accounts are synced and cantonResources is updated (e.g., instrumentUtxoCounts),
  // the selector returns stale data because the hash doesn't change, causing components to miss
  // important Canton-specific data like UTXO counts needed for transaction validation
  // See: libs/coin-modules/coin-canton/src/bridge/sync.ts
  if (a.type === "Account" && a.currency.family === "canton" && "cantonResources" in a) {
    const cantonHash = `-cantonResources(${JSON.stringify(a.cantonResources)})`;
    return baseHash + cantonHash;
  }
  return baseHash;
};
const shallowAccountsSelectorCreator = createSelectorCreator(lruMemoize, (a, b) =>
  isEqual(flattenAccounts(a).map(accountHash), flattenAccounts(b).map(accountHash)),
);
export const shallowAccountsSelector = shallowAccountsSelectorCreator(accountsSelector, a => a);

// FIXME we might reboot this idea later!
export const isUpToDateSelector = createSelector(accountsSelector, accounts =>
  accounts.map(a => {
    const { lastSyncDate } = a;
    const { blockAvgTime } = a.currency;
    let isUpToDate = true;
    if (blockAvgTime) {
      const outdated =
        Date.now() - (lastSyncDate.getTime() || 0) >
        blockAvgTime * 1000 + getEnv("SYNC_OUTDATED_CONSIDERED_DELAY");
      isUpToDate = !outdated;
    }
    return { account: a, isUpToDate };
  }),
);

export const hasAccountsSelector = createSelector(
  shallowAccountsSelector,
  accounts => accounts.length > 0,
);
// TODO: FIX RETURN TYPE
export const currenciesSelector = createSelector(shallowAccountsSelector, accounts =>
  [...new Set(flattenAccounts(accounts).map(a => getAccountCurrency(a)))].sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
);

// TODO: FIX RETURN TYPE
export const cryptoCurrenciesSelector = createSelector(shallowAccountsSelector, accounts =>
  [...new Set(accounts.map(a => a.currency))].sort((a, b) => a.name.localeCompare(b.name)),
);
export const accountSelector = createSelector(
  accountsSelector,
  (
    _: State,
    {
      accountId,
    }: {
      accountId: string;
    },
  ) => accountId,
  (accounts, accountId) => accounts.find(a => a.id === accountId),
);

export const starredAccountsSelector = createSelector(
  shallowAccountsSelector,
  walletSelector,
  (accounts, wallet) =>
    flattenAccounts(accounts).filter(a => isStarredAccountSelector(wallet, { accountId: a.id })),
);

export const isUpToDateAccountSelector = createSelector(accountSelector, isUpToDateAccount);

export const flattenAccountsSelector = createSelector(accountsSelector, flattenAccounts);
