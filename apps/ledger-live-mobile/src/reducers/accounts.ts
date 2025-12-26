import { handleActions, ReducerMap } from "redux-actions";
import type { Action } from "redux-actions";
import { createSelector, createSelectorCreator, lruMemoize } from "reselect";
import uniq from "lodash/uniq";
import {
  Account,
  AccountLike,
  AccountLikeArray,
  AccountRaw,
  TokenAccount,
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
import type { AccountsState, State } from "./types";
import type {
  AccountsDeleteAccountPayload,
  AccountsImportAccountsPayload,
  AccountsPayload,
  AccountsReorderPayload,
  AccountsUpdateAccountWithUpdaterPayload,
  SettingsBlacklistTokenPayload,
  DangerouslyOverrideStatePayload,
  AccountsReplacePayload,
} from "../actions/types";
import { AccountsActionTypes } from "../actions/types";
import accountModel from "../logic/accountModel";
import { blacklistedTokenIdsSelector } from "./settings";
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

  [AccountsActionTypes.SET_ACCOUNTS]: (state, action) => ({
    active: (action as Action<AccountsReplacePayload>).payload,
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
const shallowAccountsSelectorCreator = createSelectorCreator(lruMemoize, (a, b): boolean =>
  isEqual(
    flattenAccounts(a as AccountLikeArray).map(accountHash),
    flattenAccounts(b as AccountLikeArray).map(accountHash),
  ),
);
export const shallowAccountsSelector = shallowAccountsSelectorCreator(accountsSelector, a => a);

export const flattenAccountsSelector = createSelector(accountsSelector, flattenAccounts);

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
  (
    wallet,
    accounts,
    currency,
  ): { account: AccountLike; subAccount: TokenAccount | null; name: string }[] => {
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
                (subAcc: TokenAccount) =>
                  subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
              )) ||
            makeEmptyTokenAccount(account, currency),
        }));
    }

    return accounts
      .filter(account => account.currency.id === currency.id)
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

const emptyTuples: ReturnType<typeof accountsTuplesByCurrencySelector> = [];
export const accountsByCryptoCurrencyScreenSelector =
  (currency: CryptoOrTokenCurrency) => (state: State) => {
    // TODO look if we can remove this check as the types should already protect here
    if (!currency) return emptyTuples;
    return accountsTuplesByCurrencySelector(state, currency);
  };

const emptyArray: AccountLike[] = [];
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

type AccountsLikeSelector = (state: State) => AccountLike[];

function makeHasAccountsSelectors(accountsSelector: AccountsLikeSelector) {
  return createSelector(accountsSelector, accounts => accounts.length > 0);
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

export const hasTokenAccountsNotBlacklistedSelector = makeHasAccountsSelectors(
  tokenAccountsNotBlacklistedSelector,
);

export const hasTokenAccountsNotBlackListedWithPositiveBalanceSelector =
  makeHasAccountsWithPositiveBalanceSelector(tokenAccountsNotBlacklistedSelector);

/**
 * NON-TOKEN-ACCOUNTS SELECTORS
 */

export const nonTokenAccountsSelector = createSelector(accountsSelector, accounts =>
  flattenAccounts(accounts).filter(acc => acc.type !== "TokenAccount"),
);

export const hasNonTokenAccountsSelector = makeHasAccountsSelectors(nonTokenAccountsSelector);

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
