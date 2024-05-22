import { handleActions, ReducerMap } from "redux-actions";
import type { Action } from "redux-actions";
import { createSelector, createSelectorCreator, defaultMemoize, OutputSelector } from "reselect";
import uniq from "lodash/uniq";
import {
  Account,
  AccountLike,
  AccountLikeArray,
  AccountRaw,
  SubAccount,
} from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import isEqual from "lodash/isEqual";
import {
  isAccountEmpty,
  flattenAccounts,
  getAccountCurrency,
  isUpToDateAccount,
  clearAccount,
  makeEmptyTokenAccount,
  isAccountBalanceUnconfirmed,
} from "@ledgerhq/live-common/account/index";
import { decodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { orderByLastReceived } from "@ledgerhq/live-nft";
import type { AccountsState, State } from "./types";
import type {
  AccountsDeleteAccountPayload,
  AccountsImportAccountsPayload,
  AccountsPayload,
  AccountsReorderPayload,
  AccountsUpdateAccountWithUpdaterPayload,
  SettingsBlacklistTokenPayload,
  DangerouslyOverrideStatePayload,
} from "../actions/types";
import { AccountsActionTypes } from "../actions/types";
import accountModel from "../logic/accountModel";
import { blacklistedTokenIdsSelector, hiddenNftCollectionsSelector } from "./settings";
import { galleryChainFiltersSelector } from "./nft";
import {
  accountNameWithDefaultSelector,
  accountUserDataExportSelector,
  HandlersPayloads,
  WalletHandlerType,
} from "@ledgerhq/live-wallet/store";
import { importAccountsReduce } from "@ledgerhq/live-wallet/liveqr/importAccounts";
import { walletSelector } from "./wallet";
import { nestedSortAccounts } from "@ledgerhq/live-wallet/ordering";
import { AddAccountsAction } from "@ledgerhq/live-wallet/addAccounts";

export const INITIAL_STATE: AccountsState = {
  active: [],
};
const handlers: ReducerMap<AccountsState, Payload> = {
  [WalletHandlerType.INIT_ACCOUNTS]: (_, action) => ({
    active: (action.payload as HandlersPayloads["INIT_ACCOUNTS"]).accounts,
  }),

  [AccountsActionTypes.ACCOUNTS_USER_IMPORT]: (s, action) => ({
    active: importAccountsReduce(
      s.active,
      (action as Action<AccountsImportAccountsPayload>).payload,
    ),
  }),

  [AccountsActionTypes.ADD_ACCOUNT]: (state, action) => {
    const account = (action as Action<Account>).payload;
    if (state.active.some(a => a.id === account.id)) return state;
    return {
      active: [...state.active, account],
    };
  },

  [AccountsActionTypes.REORDER_ACCOUNTS]: (state, action) => ({
    active: nestedSortAccounts(state.active, (action as Action<AccountsReorderPayload>).payload),
  }),

  [WalletHandlerType.ADD_ACCOUNTS]: (s, action) => {
    const { payload } = action as AddAccountsAction;
    return {
      active: payload.allAccounts,
    };
  },

  [AccountsActionTypes.UPDATE_ACCOUNT]: (state, action) => {
    const {
      payload: { accountId, updater },
    } = action as Action<AccountsUpdateAccountWithUpdaterPayload>;
    function update(existingAccount: Account) {
      if (accountId !== existingAccount.id) return existingAccount;
      return { ...existingAccount, ...updater(existingAccount) };
    }

    return {
      active: state.active.map(update),
    };
  },

  [AccountsActionTypes.DELETE_ACCOUNT]: (state, action) => ({
    active: state.active.filter(
      acc => acc.id !== (action as Action<AccountsDeleteAccountPayload>).payload.id,
    ),
  }),

  [AccountsActionTypes.CLEAN_CACHE]: (state: AccountsState) => ({
    active: state.active.map(clearAccount),
  }),

  [AccountsActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (
    state: AccountsState,
    action,
  ): AccountsState => ({
    ...state,
    ...(action as Action<DangerouslyOverrideStatePayload>).payload.accounts,
  }),
};

// Selectors

export function exportSelector(state: State): {
  active: {
    data: AccountRaw;
    version: number;
  }[];
} {
  const active = [];
  for (const account of state.accounts.active) {
    const accountUserData = accountUserDataExportSelector(state.wallet, { account });
    if (accountUserData) {
      active.push(accountModel.encode([account, accountUserData]));
    }
  }
  return { active };
}

/**
 * Warning: use this selector directly in `useSelector` only if you really need
 * the full data of all the accounts in your hook or component.
 * For many needs, other more accurate and memoized selectors (see below) are
 * available.
 * Using these selectors will prevent unnecessary updates (causing a re-render)
 * of your hook or component every time something somewhere in one of the
 * accounts changes.
 * This is important because the `accounts` array is modified at the end almost
 * every account sync, so potentially you could avoid many unnessary and
 * expensive re-renders.
 */
export const accountsSelector = (s: State): Account[] => s.accounts.active;

// NB some components don't need to refresh every time an account is updated, usually it's only
// when the balance/name/length/starred/swapHistory of accounts changes.
const accountHash = (a: AccountLike) =>
  `${a.id}-${a.balance.toString()}-swapHistory(${a.swapHistory.length})`;

// TODO can we share with desktop in common?
const shallowAccountsSelectorCreator = createSelectorCreator(defaultMemoize, (a, b): boolean =>
  isEqual(
    flattenAccounts(a as AccountLikeArray).map(accountHash),
    flattenAccounts(b as AccountLikeArray).map(accountHash),
  ),
);
export const shallowAccountsSelector = shallowAccountsSelectorCreator(accountsSelector, a => a);

export const flattenAccountsSelector = createSelector(accountsSelector, flattenAccounts);
export const flattenAccountsEnforceHideEmptyTokenSelector = createSelector(
  accountsSelector,
  accounts =>
    flattenAccounts(accounts, {
      enforceHideEmptySubAccounts: true,
    }),
);
export const accountsCountSelector = createSelector(accountsSelector, acc => acc.length);
/** Returns a boolean that is true if and only if there is no account */
export const hasNoAccountsSelector = createSelector(accountsSelector, acc => acc.length <= 0);
/** Returns a boolean that is true if and only if all accounts are empty */
export const areAccountsEmptySelector = createSelector(accountsSelector, accounts =>
  accounts.every(isAccountEmpty),
);

export const currenciesSelector = createSelector(accountsSelector, accounts =>
  uniq(flattenAccounts(accounts).map(a => getAccountCurrency(a))).sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
);
export const cryptoCurrenciesSelector = createSelector(accountsSelector, accounts =>
  uniq(accounts.map(a => a.currency)).sort((a, b) => a.name.localeCompare(b.name)),
);
export const accountsTuplesByCurrencySelector = createSelector(
  walletSelector,
  accountsSelector,
  (_: State, currency: CryptoCurrency | TokenCurrency) => currency,
  (_: State, currency: CryptoCurrency | TokenCurrency, accountIds?: Map<string, boolean>) =>
    accountIds,
  (
    wallet,
    accounts,
    currency,
    accountIds,
  ): { account: AccountLike; subAccount: SubAccount | null; name: string }[] => {
    if (currency.type === "TokenCurrency") {
      return accounts
        .filter(account => {
          // not checking subAccounts against accountIds for TokenCurrency
          // because the wallet-api is not able to setup empty accounts
          // for all parentAccounts and currencies we support
          // and we would lose the empty token accounts in the select account
          return account.currency.id === currency.parentCurrency.id;
        })
        .map(account => ({
          name: accountNameWithDefaultSelector(wallet, account),
          account,
          subAccount:
            (account.subAccounts &&
              account.subAccounts.find(
                (subAcc: SubAccount) =>
                  subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
              )) ||
            makeEmptyTokenAccount(account, currency),
        }));
    }

    return accounts
      .filter(
        account =>
          account.currency.id === currency.id && (accountIds ? accountIds.has(account.id) : true),
      )
      .map(account => ({
        name: accountNameWithDefaultSelector(wallet, account),
        account,
        subAccount: null,
      }));
  },
);
export const flattenAccountsByCryptoCurrencySelector = createSelector(
  flattenAccountsSelector,
  (_: State, currency: string) => currency,
  (accounts, currency): AccountLike[] => {
    return currency
      ? accounts.filter(a => currency === (a.type === "TokenAccount" ? a.token.id : a.currency.id))
      : accounts;
  },
);
const emptyArray: AccountLike[] = [];
export const accountsByCryptoCurrencyScreenSelector =
  (currency: CryptoOrTokenCurrency, accountIds?: Map<string, boolean>) => (state: State) => {
    if (!currency) return emptyArray;
    return accountsTuplesByCurrencySelector(state, currency, accountIds);
  };

export const flattenAccountsByCryptoCurrencyScreenSelector =
  (currency?: CryptoCurrency | TokenCurrency) => (state: State) => {
    if (!currency) return emptyArray;
    return flattenAccountsByCryptoCurrencySelector(state, currency.id);
  };

export const accountSelector = createSelector(
  accountsSelector,
  (
    _: State,
    { accountId, parentAccount }: { accountId?: string | null; parentAccount?: Account },
  ) => [accountId, parentAccount] as const,
  (accounts, [accountId, parentAccount]) => accounts.find(a => a.id === accountId) || parentAccount,
);
export const parentAccountSelector = createSelector(
  accountsSelector,
  (_: State, { account }: { account?: AccountLike }) =>
    account && account.type !== "Account" ? account.parentId : null,
  (accounts, accountId) => accounts.find(a => a.id === accountId),
);
export const accountScreenSelector =
  (route?: {
    params?: {
      account?: AccountLike;
      accountId?: string | null;
      parentId?: string | null;
    };
  }) =>
  (state: State) => {
    const { accountId, parentId } = route?.params || {};
    const parentAccount: Account | null | undefined = parentId
      ? accountSelector(state, {
          accountId: parentId,
        })
      : null;
    let account = route?.params?.account;

    if (accountId === parentId && parentAccount) {
      account = parentAccount;
    }

    if (!account) {
      if (parentAccount) {
        const { subAccounts } = parentAccount;

        if (subAccounts) {
          account = subAccounts.find(t => t.id === accountId);
        }
      } else {
        account = accountSelector(state, {
          accountId,
        });
      }
    }

    return {
      parentAccount,
      account,
    };
  };
export const isUpToDateSelector = createSelector(accountsSelector, accounts =>
  accounts.every(isUpToDateAccount),
);
export const subAccountByCurrencyOrderedSelector = createSelector(
  accountsSelector,
  (_: State, currency: CryptoCurrency | TokenCurrency) => currency,
  (accounts, currency) => {
    const flatAccounts = flattenAccounts(accounts);
    return flatAccounts
      .filter(
        (account: AccountLike) =>
          (account.type === "TokenAccount" ? account.token.id : account.currency.id) ===
          currency.id,
      )
      .map((account: AccountLike) => ({
        account,
        parentAccount:
          account.type === "TokenAccount" && account.parentId
            ? accounts.find(fa => fa.type === "Account" && fa.id === account.parentId)
            : {},
      }))
      .sort((a: { account: AccountLike }, b: { account: AccountLike }) =>
        a.account.balance.gt(b.account.balance)
          ? -1
          : a.account.balance.eq(b.account.balance)
            ? 0
            : 1,
      );
  },
);
export const subAccountByCurrencyOrderedScreenSelector =
  (route: { params?: { currency?: CryptoOrTokenCurrency } }) => (state: State) => {
    const currency = route?.params?.currency;
    if (!currency) return [];
    return subAccountByCurrencyOrderedSelector(state, currency);
  };

function accountHasPositiveBalance(account: AccountLike) {
  return Boolean(account.balance?.gt(0));
}

export const accountsWithPositiveBalanceCountSelector = createSelector(
  accountsSelector,
  acc => acc.filter(accountHasPositiveBalance).length,
);

/**
 * Selector creators
 */

type AccountsLikeSelector = OutputSelector<
  State,
  AccountLike[],
  (res: Account[], res2: string[]) => AccountLike[]
>;

function makeAccountsCountSelectors(accountsSelector: AccountsLikeSelector) {
  return createSelector(accountsSelector, accounts => accounts.length);
}

function makeHasAccountsSelectors(accountsSelector: AccountsLikeSelector) {
  return createSelector(accountsSelector, accounts => accounts.length > 0);
}

function makeAccountsWithPositiveBalanceCountSelector(accountsSelector: AccountsLikeSelector) {
  return createSelector(
    accountsSelector,
    accounts => accounts.filter(accountHasPositiveBalance).length,
  );
}

function makeHasAccountsWithPositiveBalanceSelector(accountsSelector: AccountsLikeSelector) {
  return createSelector(
    accountsSelector,
    accounts => accounts.filter(accountHasPositiveBalance).length > 0,
  );
}

/**
 * TOKEN-ACCOUNTS SELECTORS
 */

export const tokenAccountsSelector = createSelector(accountsSelector, accounts =>
  flattenAccounts(accounts).filter(acc => acc.type === "TokenAccount"),
);

export const tokenAccountsNotBlacklistedSelector = createSelector(
  tokenAccountsSelector,
  blacklistedTokenIdsSelector,
  (accounts, blacklistedIds) =>
    accounts.filter(acc => !blacklistedIds.includes(getAccountCurrency(acc).id)),
);

export const tokenAccountsCountSelector = makeAccountsCountSelectors(tokenAccountsSelector);

export const tokenAccountsNotBlacklistedCountSelector = makeAccountsCountSelectors(
  tokenAccountsNotBlacklistedSelector,
);

export const hasTokenAccountsSelector = makeHasAccountsSelectors(tokenAccountsSelector);

export const hasTokenAccountsNotBlacklistedSelector = makeHasAccountsSelectors(
  tokenAccountsNotBlacklistedSelector,
);

export const tokenAccountsWithPositiveBalanceCountSelector =
  makeAccountsWithPositiveBalanceCountSelector(tokenAccountsSelector);

export const tokenAccountsNotBlackListedWithPositiveBalanceCountSelector =
  makeAccountsWithPositiveBalanceCountSelector(tokenAccountsNotBlacklistedSelector);

export const hasTokenAccountsWithPositiveBalanceSelector =
  makeHasAccountsWithPositiveBalanceSelector(tokenAccountsSelector);

export const hasTokenAccountsNotBlackListedWithPositiveBalanceSelector =
  makeHasAccountsWithPositiveBalanceSelector(tokenAccountsNotBlacklistedSelector);

/**
 * NON-TOKEN-ACCOUNTS SELECTORS
 */

export const nonTokenAccountsSelector = createSelector(accountsSelector, accounts =>
  flattenAccounts(accounts).filter(acc => acc.type !== "TokenAccount"),
);

export const nonTokenAccountsCountSelector = makeAccountsCountSelectors(nonTokenAccountsSelector);

export const hasNonTokenAccountsSelector = makeHasAccountsSelectors(nonTokenAccountsSelector);

export const nonTokenAccountsWithPositiveBalanceCountSelector =
  makeAccountsWithPositiveBalanceCountSelector(nonTokenAccountsSelector);

export const hasNonTokenAccountsWithPositiveBalanceSelector =
  makeHasAccountsWithPositiveBalanceSelector(nonTokenAccountsSelector);

export const nftsSelector = createSelector(accountsSelector, accounts =>
  accounts.map(a => a.nfts ?? []).flat(),
);

export const orderedNftsSelector = createSelector(
  accountsSelector,
  nftsSelector,
  (accounts, nfts) => orderByLastReceived(accounts, nfts),
);

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
  orderedNftsSelector,
  hiddenNftCollectionsSelector,
  (nfts, hiddenNftCollections) =>
    nfts.filter(
      nft => !hiddenNftCollections.includes(`${decodeNftId(nft.id).accountId}|${nft.contract}`),
    ),
);

export const hasNftsSelector = createSelector(nftsSelector, nfts => {
  return !!nfts.length;
});

export const filteredNftsSelector = createSelector(
  galleryChainFiltersSelector,
  orderedVisibleNftsSelector,
  (galleryFilters, orderedNfts) => {
    const activeFilters = Object.entries(galleryFilters)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
    return orderedNfts.filter(nft => activeFilters.includes(nft.currencyId));
  },
);

/**
 * Returns a boolean that is true if and only if some of the accounts have an
 * unconfirmed balance
 */
export const areSomeAccountsBalanceUnconfirmedSelector = createSelector(
  accountsSelector,
  accounts => accounts.some(isAccountBalanceUnconfirmed),
);

type Payload = AccountsPayload | SettingsBlacklistTokenPayload | AddAccountsAction["payload"];

export default handleActions<AccountsState, Payload>(handlers, INITIAL_STATE);
