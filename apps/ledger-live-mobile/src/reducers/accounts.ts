import { handleActions, ReducerMap } from "redux-actions";
import type { Action } from "redux-actions";
import {
  createSelector,
  createSelectorCreator,
  defaultMemoize,
} from "reselect";
import uniq from "lodash/uniq";
import {
  Account,
  AccountLike,
  AccountLikeArray,
  SubAccount,
} from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  makeCompoundSummaryForAccount,
  getAccountCapabilities,
} from "@ledgerhq/live-common/compound/logic";
import isEqual from "lodash/isEqual";
import {
  addAccounts,
  canBeMigrated,
  flattenAccounts,
  getAccountCurrency,
  importAccountsReduce,
  isUpToDateAccount,
  clearAccount,
  nestedSortAccounts,
  makeEmptyTokenAccount,
} from "@ledgerhq/live-common/account/index";
import type { AccountsState, State } from "./types";
import type {
  AccountsDeleteAccountPayload,
  AccountsImportAccountsPayload,
  AccountsImportStorePayload,
  AccountsPayload,
  AccountsReorderPayload,
  AccountsReplaceAccountsPayload,
  AccountsSetAccountsPayload,
  AccountsUpdateAccountWithUpdaterPayload,
  SettingsBlacklistTokenPayload,
} from "../actions/types";
import { AccountsActionTypes } from "../actions/types";
import accountModel from "../logic/accountModel";

export const INITIAL_STATE: AccountsState = {
  active: [],
};
const handlers: ReducerMap<AccountsState, Payload> = {
  [AccountsActionTypes.ACCOUNTS_IMPORT]: (_, action) => ({
    active: (action as Action<AccountsImportStorePayload>).payload.active,
  }),

  [AccountsActionTypes.ACCOUNTS_USER_IMPORT]: (s, action) => ({
    active: importAccountsReduce(
      s.active,
      (action as Action<AccountsImportAccountsPayload>).payload.input,
    ),
  }),

  [AccountsActionTypes.REORDER_ACCOUNTS]: (state, action) => ({
    active: nestedSortAccounts(
      state.active,
      (action as Action<AccountsReorderPayload>).payload.comparator,
    ),
  }),

  [AccountsActionTypes.ACCOUNTS_ADD]: (s, action) => {
    const {
      payload: { scannedAccounts, selectedIds, renamings },
    } = action as Action<AccountsReplaceAccountsPayload>;
    return {
      active: addAccounts({
        existingAccounts: s.active,
        scannedAccounts,
        selectedIds,
        renamings,
      }),
    };
  },

  [AccountsActionTypes.SET_ACCOUNTS]: (_, action) =>
    (action as Action<AccountsSetAccountsPayload>).payload,

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
      acc =>
        acc.id !==
        (action as Action<AccountsDeleteAccountPayload>).payload.account.id,
    ),
  }),

  [AccountsActionTypes.CLEAN_CACHE]: (state: AccountsState) => ({
    active: state.active.map(clearAccount),
  }),
  DANGEROUSLY_OVERRIDE_STATE: (state: AccountsState): AccountsState => ({
    ...state,
  }),
};

// Selectors
export const exportSelector = (s: State) => ({
  active: s.accounts.active.map(accountModel.encode),
});

export const accountsSelector = (s: State): Account[] => s.accounts.active;

// NB some components don't need to refresh every time an account is updated, usually it's only
// when the balance/name/length/starred/swapHistory of accounts changes.
const accountHash = (a: AccountLike) =>
  `${a.type === "Account" ? a.name : ""}-${a.id}${
    a.starred ? "-*" : ""
  }-${a.balance.toString()}-swapHistory(${a.swapHistory.length})`;

// TODO can we share with desktop in common?
const shallowAccountsSelectorCreator = createSelectorCreator(
  defaultMemoize,
  (a, b): boolean =>
    isEqual(
      flattenAccounts(a as AccountLikeArray).map(accountHash),
      flattenAccounts(b as AccountLikeArray).map(accountHash),
    ),
);
export const shallowAccountsSelector = shallowAccountsSelectorCreator(
  accountsSelector,
  a => a,
);

export const migratableAccountsSelector = (s: State): Account[] =>
  s.accounts.active.filter(canBeMigrated);

export const flattenAccountsSelector = createSelector(
  accountsSelector,
  flattenAccounts,
);
export const flattenAccountsEnforceHideEmptyTokenSelector = createSelector(
  accountsSelector,
  accounts =>
    flattenAccounts(accounts, {
      enforceHideEmptySubAccounts: true,
    }),
);
export const accountsCountSelector = createSelector(
  accountsSelector,
  acc => acc.length,
);
export const someAccountsNeedMigrationSelector = createSelector(
  accountsSelector,
  accounts => accounts.some(canBeMigrated),
);
export const currenciesSelector = createSelector(accountsSelector, accounts =>
  uniq(flattenAccounts(accounts).map(a => getAccountCurrency(a))).sort((a, b) =>
    a.name.localeCompare(b.name),
  ),
);
export const cryptoCurrenciesSelector = createSelector(
  accountsSelector,
  accounts =>
    uniq(accounts.map(a => a.currency)).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
);
export const accountsTuplesByCurrencySelector = createSelector(
  accountsSelector,
  (_: State, { currency }: { currency: CryptoCurrency | TokenCurrency }) =>
    currency,
  (
    accounts,
    currency,
  ): { account: AccountLike; subAccount: SubAccount | null }[] => {
    if (currency.type === "TokenCurrency") {
      return accounts
        .filter(account => account.currency.id === currency.parentCurrency.id)
        .map(account => ({
          account,
          subAccount:
            (account.subAccounts &&
              account.subAccounts.find(
                (subAcc: SubAccount) =>
                  subAcc.type === "TokenAccount" &&
                  subAcc.token.id === currency.id,
              )) ||
            makeEmptyTokenAccount(account, currency),
        }));
    }

    return accounts
      .filter(account => account.currency.id === currency.id)
      .map(account => ({
        account,
        subAccount: null,
      }));
  },
);
export const flattenAccountsByCryptoCurrencySelector = createSelector(
  flattenAccountsSelector,
  (_: State, { currencies }: { currencies: Array<string> }) => currencies,
  (accounts, currencies): AccountLike[] =>
    currencies && currencies.length
      ? accounts.filter(a =>
          currencies.includes(
            a.type === "TokenAccount" ? a.token.id : a.currency.id,
          ),
        )
      : accounts,
);
const emptyArray: AccountLike[] = [];
export const accountsByCryptoCurrencyScreenSelector =
  (currency: CryptoCurrency) => (state: State) => {
    if (!currency) return emptyArray;
    return accountsTuplesByCurrencySelector(state, { currency });
  };

export const flattenAccountsByCryptoCurrencyScreenSelector =
  (currency?: CryptoCurrency | TokenCurrency) => (state: State) => {
    if (!currency) return emptyArray;
    return flattenAccountsByCryptoCurrencySelector(state, {
      currencies: [currency.id],
    });
  };

// FIXME: NEVER USED ANYWHERE ELSE - DROP ?
export const accountCryptoCurrenciesSelector = createSelector(
  cryptoCurrenciesSelector,
  (_: State, { currencies }: { currencies: Array<string> }) => currencies,
  (cryptoCurrencies, currencies) =>
    currencies && currencies.length
      ? cryptoCurrencies.filter(c => currencies.includes(c.id))
      : cryptoCurrencies,
);

export const accountSelector = createSelector(
  accountsSelector,
  (
    _: State,
    {
      accountId,
      parentAccount,
    }: { accountId?: string | null; parentAccount?: Account },
  ) => [accountId, parentAccount] as const,
  (accounts, [accountId, parentAccount]) =>
    accounts.find(a => a.id === accountId) || parentAccount,
);
export const parentAccountSelector = createSelector(
  accountsSelector,
  (_: State, { account }: { account?: SubAccount }) =>
    account ? account.parentId : null,
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
  (
    _: State,
    {
      currency,
    }: {
      currency: CryptoCurrency | TokenCurrency;
    },
  ) => currency,
  (accounts, currency) => {
    const flatAccounts = flattenAccounts(accounts);
    return flatAccounts
      .filter(
        (account: AccountLike) =>
          (account.type === "TokenAccount"
            ? account.token.id
            : account.currency.id) === currency.id,
      )
      .map((account: AccountLike) => ({
        account,
        parentAccount:
          account.type === "TokenAccount" && account.parentId
            ? accounts.find(
                fa => fa.type === "Account" && fa.id === account.parentId,
              )
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
  (route: { params?: { currency?: CryptoOrTokenCurrency } }) =>
  (state: State) => {
    const currency = route?.params?.currency;
    if (!currency) return [];
    return subAccountByCurrencyOrderedSelector(state, {
      currency,
    });
  };
export const hasLendEnabledAccountsSelector = createSelector(
  flattenAccountsSelector,
  accounts =>
    accounts.some(account => {
      if (!account || account.type !== "TokenAccount") return false;
      // check if account already has lending enabled
      const summary =
        account.type === "TokenAccount" &&
        makeCompoundSummaryForAccount(account, undefined);
      const capabilities = summary
        ? account.type === "TokenAccount" && getAccountCapabilities(account)
        : null;
      return !!capabilities;
    }),
);

type Payload = AccountsPayload | SettingsBlacklistTokenPayload;

export default handleActions<AccountsState, Payload>(handlers, INITIAL_STATE);
