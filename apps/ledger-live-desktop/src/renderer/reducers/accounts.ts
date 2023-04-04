import { createSelector, createSelectorCreator, defaultMemoize, OutputSelector } from "reselect";
import { handleActions } from "redux-actions";
import { Account, AccountLike, NFT } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  flattenAccounts,
  clearAccount,
  getAccountCurrency,
  isUpToDateAccount,
  nestedSortAccounts,
} from "@ledgerhq/live-common/account/index";
import { decodeNftId } from "@ledgerhq/live-common/nft/index";
import { orderByLastReceived } from "@ledgerhq/live-common/nft/helpers";
import { getEnv } from "@ledgerhq/live-common/env";
import isEqual from "lodash/isEqual";
import logger from "../logger";
import accountModel from "./../../helpers/accountModel";
import { State } from ".";

import { hiddenNftCollectionsSelector } from "./settings";
export type AccountsState = Account[];
const state: AccountsState = [];
const handlers: object = {
  REORDER_ACCOUNTS: (
    state: AccountsState,
    {
      payload: { comparator },
    }: {
      payload: {
        comparator: any;
      };
    },
  ): AccountsState => nestedSortAccounts(state, comparator),
  SET_ACCOUNTS: (
    state: AccountsState,
    {
      payload: accounts,
    }: {
      payload: Account[];
    },
  ): AccountsState => accounts,
  ADD_ACCOUNT: (
    state: AccountsState,
    {
      payload: account,
    }: {
      payload: Account;
    },
  ): AccountsState => {
    if (state.some(a => a.id === account.id)) {
      logger.warn("ADD_ACCOUNT attempt for an account that already exists!", account.id);
      return state;
    }
    return [...state, account];
  },
  REPLACE_ACCOUNTS: (
    state: AccountsState,
    {
      payload,
    }: {
      payload: Account[];
    },
  ) => payload,
  UPDATE_ACCOUNT: (
    state: AccountsState,
    {
      payload: { accountId, updater },
    }: {
      payload: {
        accountId: string;
        updater: (a: Account) => Account;
      };
    },
  ): AccountsState =>
    state.map(existingAccount => {
      if (existingAccount.id !== accountId) {
        return existingAccount;
      }
      return updater(existingAccount);
    }),
  REMOVE_ACCOUNT: (
    state: AccountsState,
    {
      payload: account,
    }: {
      payload: Account;
    },
  ): AccountsState => state.filter(acc => acc.id !== account.id),
  CLEAN_FULLNODE_DISCONNECT: (state: AccountsState): AccountsState =>
    state.filter(acc => acc.currency.id !== "bitcoin"),
  CLEAN_ACCOUNTS_CACHE: (state: AccountsState): AccountsState => state.map(clearAccount),
  // used to debug performance of redux updates
  DEBUG_TICK: state => state.slice(0),
};

// Selectors

export const accountsSelector = (state: { accounts: AccountsState }): Account[] => state.accounts;

// NB some components don't need to refresh every time an account is updated, usually it's only
// when the balance/name/length/starred/swapHistory of accounts changes.
const accountHash = (a: AccountLike) =>
  `${a.type === "Account" ? a.name : ""}-${a.id}${
    a.starred ? "-*" : ""
  }-${a.balance.toString()}-swapHistory(${a.swapHistory.length})`;
const shallowAccountsSelectorCreator = createSelectorCreator(defaultMemoize, (a, b) =>
  isEqual(flattenAccounts(a).map(accountHash), flattenAccounts(b).map(accountHash)),
);
export const shallowAccountsSelector: OutputSelector<
  State,
  void,
  Account[]
> = shallowAccountsSelectorCreator(accountsSelector, a => a);
export const subAccountByCurrencyOrderedSelector: OutputSelector<
  State,
  {
    currency: CryptoCurrency | TokenCurrency;
  },
  Array<{
    parentAccount: Account | undefined | null;
    account: AccountLike;
  }>
> = createSelector(
  accountsSelector,
  (
    _,
    {
      currency,
    }: {
      currency: CryptoCurrency | TokenCurrency;
    },
  ) => currency,
  (accounts, currency) => {
    const flatAccounts = flattenAccounts(accounts);
    return currency
      ? flatAccounts
          .filter(
            account =>
              (account.type === "TokenAccount" ? account.token.id : account.currency.id) ===
              currency.id,
          )
          .map(account => ({
            account,
            parentAccount:
              account.type === "TokenAccount" && account.parentId
                ? accounts.find(fa => fa.type === "Account" && fa.id === account.parentId)
                : {},
          }))
          .sort((a, b) =>
            a.account.balance.gt(b.account.balance)
              ? -1
              : a.account.balance.eq(b.account.balance)
              ? 0
              : 1,
          )
      : [];
  },
);

// FIXME we might reboot this idea later!
export const activeAccountsSelector = accountsSelector;
export const isUpToDateSelector: OutputSelector<State, void, boolean> = createSelector(
  activeAccountsSelector,
  accounts =>
    accounts.every(a => {
      const { lastSyncDate } = a;
      const { blockAvgTime } = a.currency;
      if (!blockAvgTime) return true;
      const outdated =
        Date.now() - (lastSyncDate || 0) >
        blockAvgTime * 1000 + getEnv("SYNC_OUTDATED_CONSIDERED_DELAY");
      return !outdated;
    }),
);
export const hasAccountsSelector: OutputSelector<State, void, boolean> = createSelector(
  shallowAccountsSelector,
  accounts => accounts.length > 0,
);
// TODO: FIX RETURN TYPE
export const currenciesSelector: OutputSelector<
  State,
  void,
  any
> = createSelector(shallowAccountsSelector, accounts =>
  [...new Set(flattenAccounts(accounts).map(a => getAccountCurrency(a)))].sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
);

// TODO: FIX RETURN TYPE
export const cryptoCurrenciesSelector: OutputSelector<
  State,
  void,
  any
> = createSelector(shallowAccountsSelector, accounts =>
  [...new Set(accounts.map(a => a.currency))].sort((a, b) => a.name.localeCompare(b.name)),
);
export const currenciesIdSelector: OutputSelector<
  State,
  void,
  string[]
> = createSelector(cryptoCurrenciesSelector, (currencies: CryptoCurrency[]) =>
  currencies.map(currency => currency.id),
);
export const accountSelector: OutputSelector<
  State,
  {
    accountId: string;
  },
  Account | undefined | null
> = createSelector(
  accountsSelector,
  (
    _,
    {
      accountId,
    }: {
      accountId: string;
    },
  ) => accountId,
  (accounts, accountId) => accounts.find(a => a.id === accountId),
);
export const getAccountById: OutputSelector<
  State,
  {},
  (id: string) => Account | undefined | null
> = createSelector(accountsSelector, accounts => (accountId: string) =>
  accounts.find(a => a.id === accountId),
);

export const starredAccountsSelector: OutputSelector<
  State,
  void,
  AccountLike[]
> = createSelector(shallowAccountsSelector, accounts =>
  flattenAccounts(accounts).filter(a => a.starred),
);
export const isStarredAccountSelector = (
  s: any,
  {
    accountId,
  }: {
    accountId: string;
  },
): boolean => flattenAccounts(s.accounts).some(a => a.id === accountId && a.starred);

export const isUpToDateAccountSelector: OutputSelector<
  State,
  {
    accountId: string;
  },
  boolean
> = createSelector(accountSelector, isUpToDateAccount);
export const getAllNFTs: OutputSelector<State, {}, NFT[]> = createSelector(
  accountsSelector,
  accounts => accounts.flatMap(account => account.nfts).filter(Boolean),
);
export const getNFTById: OutputSelector<
  State,
  {
    nftId: string;
  },
  NFT
> = createSelector(
  getAllNFTs,
  (
    _,
    {
      nftId,
    }: {
      nftId: string;
    },
  ) => nftId,
  (nfts, nftId) => nfts.find(nft => nft.id === nftId),
);
export const decodeAccountsModel = (raws: any) => (raws || []).map(accountModel.decode);
export const encodeAccountsModel = (accounts: any) => (accounts || []).map(accountModel.encode);
export default handleActions(handlers, state);
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
 * import { isEqual } from "lodash";
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
