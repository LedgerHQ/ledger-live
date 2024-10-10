import { createSelector, createSelectorCreator, defaultMemoize } from "reselect";
import { handleActions } from "redux-actions";
import { Account, AccountUserData, AccountLike } from "@ledgerhq/types-live";
import {
  flattenAccounts,
  clearAccount,
  getAccountCurrency,
  isUpToDateAccount,
} from "@ledgerhq/live-common/account/index";
import { decodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { orderByLastReceived } from "@ledgerhq/live-nft";
import { getEnv } from "@ledgerhq/live-env";
import isEqual from "lodash/isEqual";
import { State } from ".";
import { hiddenNftCollectionsSelector } from "./settings";
import { Handlers } from "./types";
import { walletSelector } from "./wallet";
import { isStarredAccountSelector } from "@ledgerhq/live-wallet/store";
import { nestedSortAccounts, AccountComparator } from "@ledgerhq/live-wallet/ordering";
import { AddAccountsAction } from "@ledgerhq/live-wallet/addAccounts";

/*
FIXME
where is the accounts ordering source of truth?
we could go => Map<string, Account> accounts
but we can't because nestedSortAccounts
*/

export type AccountsState = Account[];
const state: AccountsState = [];

type HandlersPayloads = {
  REORDER_ACCOUNTS: { comparator: AccountComparator };
  INIT_ACCOUNTS: { accounts: Account[]; accountsUserData: AccountUserData[] };
  ADD_ACCOUNTS: AddAccountsAction["payload"];
  UPDATE_ACCOUNT: { accountId: string; updater: (a: Account) => Account };
  REMOVE_ACCOUNT: Account;
  CLEAN_FULLNODE_DISCONNECT: never;
  CLEAN_ACCOUNTS_CACHE: never;
  REPLACE_ACCOUNTS: Account[];
};

type AccountsHandlers<PreciseKey = true> = Handlers<AccountsState, HandlersPayloads, PreciseKey>;

const handlers: AccountsHandlers = {
  REORDER_ACCOUNTS: (state, { payload: { comparator } }) => nestedSortAccounts(state, comparator),
  INIT_ACCOUNTS: (_, { payload: { accounts } }) => accounts,
  ADD_ACCOUNTS: (_, { payload }) => payload.allAccounts,
  UPDATE_ACCOUNT: (state, { payload: { accountId, updater } }) =>
    state.map(existingAccount => {
      if (existingAccount.id !== accountId) {
        return existingAccount;
      }
      return updater(existingAccount);
    }),
  REMOVE_ACCOUNT: (state, { payload: account }) => state.filter(acc => acc.id !== account.id),
  CLEAN_FULLNODE_DISCONNECT: state => state.filter(acc => acc.currency.id !== "bitcoin"),
  CLEAN_ACCOUNTS_CACHE: state => state.map(clearAccount),
  REPLACE_ACCOUNTS: (state, { payload }) => payload,
};

export default handleActions<AccountsState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as AccountsHandlers<false>,
  state,
);

// Selectors

export const accountsSelector = (state: { accounts: AccountsState }): Account[] => state.accounts;

// NB some components don't need to refresh every time an account is updated, usually it's only
// when the balance/name/length/starred/swapHistory of accounts changes.
const accountHash = (a: AccountLike) =>
  `${a.id}-${a.balance.toString()}-swapHistory(${a.swapHistory?.length || "0"})`;
const shallowAccountsSelectorCreator = createSelectorCreator(defaultMemoize, (a, b) =>
  isEqual(flattenAccounts(a).map(accountHash), flattenAccounts(b).map(accountHash)),
);
export const shallowAccountsSelector = shallowAccountsSelectorCreator(accountsSelector, a => a);

// FIXME we might reboot this idea later!
export const activeAccountsSelector = accountsSelector;
export const isUpToDateSelector = createSelector(activeAccountsSelector, accounts =>
  accounts.every(a => {
    const { lastSyncDate } = a;
    const { blockAvgTime } = a.currency;
    if (!blockAvgTime) return true;
    const outdated =
      Date.now() - (lastSyncDate.getTime() || 0) >
      blockAvgTime * 1000 + getEnv("SYNC_OUTDATED_CONSIDERED_DELAY");
    return !outdated;
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
export const getAllNFTs = createSelector(accountsSelector, accounts =>
  accounts.flatMap(account => account.nfts).filter(Boolean),
);
export const getNFTById = createSelector(
  getAllNFTs,
  (
    _: State,
    {
      nftId,
    }: {
      nftId: string;
    },
  ) => nftId,
  (nfts, nftId) => nfts.find(nft => nft?.id === nftId),
);

export const getNFTsByListOfIds = createSelector(
  getAllNFTs,
  (
    _: State,
    {
      nftIds,
    }: {
      nftIds: string[];
    },
  ) => nftIds,
  (nfts, nftIds) => nfts.filter(nft => nft && nft.id && nftIds.includes(nft.id)),
);

export const flattenAccountsSelector = createSelector(accountsSelector, flattenAccounts);

/**
 * Returns the list of all the NFTs from non hidden collections accross all
 * accounts, ordered by last received.
 *
 * /!\ Use this with a deep equal comparison if possible as it will always
 * return a new array if `accounts` or `hiddenNftCollections` changes.
 *
 * Example:
 * ```
 * import isEqual from "lodash/isEqual";
 * // ...
 * const orderedVisibleNfts = useSelector(orderedVisibleNftsSelector, isEqual)
 * ```
 * */
export const orderedVisibleNftsSelector = createSelector(
  accountsSelector,
  hiddenNftCollectionsSelector,
  (accounts, hiddenNftCollections) => {
    const nfts = accounts.map(a => a.nfts ?? []).flat();
    const visibleNfts = nfts.filter(
      nft => !hiddenNftCollections.includes(`${decodeNftId(nft.id).accountId}|${nft.contract}`),
    );
    return orderByLastReceived(accounts, visibleNfts);
  },
);
