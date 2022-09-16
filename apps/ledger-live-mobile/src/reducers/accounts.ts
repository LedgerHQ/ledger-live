import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import uniq from "lodash/uniq";
import type { OutputSelector } from "reselect";
import type { Account, AccountLike, SubAccount } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  makeCompoundSummaryForAccount,
  getAccountCapabilities,
} from "@ledgerhq/live-common/compound/logic";
import {
  addAccounts,
  canBeMigrated,
  flattenAccounts,
  getAccountCurrency,
  importAccountsReduce,
  isUpToDateAccount,
  withoutToken,
  clearAccount,
  nestedSortAccounts,
  makeEmptyTokenAccount,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/account/index";
import type { State } from "./index";
import accountModel from "../logic/accountModel";

export type AccountsState = {
  active: Account[];
};
const initialState: AccountsState = {
  active: [],
};
const handlers: Record<string, any> = {
  ACCOUNTS_IMPORT: (s, { state }) => state,
  ACCOUNTS_USER_IMPORT: (
    s: AccountsState,
    { input }: { input: ImportAccountsReduceInput },
  ) => ({
    active: importAccountsReduce(s.active, input),
  }),
  REORDER_ACCOUNTS: (
    state: AccountsState,
    {
      payload: { comparator },
    }: {
      payload: {
        comparator: any;
      };
    },
  ): AccountsState => ({
    active: nestedSortAccounts(state.active, comparator),
  }),
  ACCOUNTS_ADD: (s, { scannedAccounts, selectedIds, renamings }) => ({
    active: addAccounts({
      existingAccounts: s.active,
      scannedAccounts,
      selectedIds,
      renamings,
    }),
  }),
  SET_ACCOUNTS: (
    state: AccountsState,
    {
      payload,
    }: {
      payload: Account[];
    },
  ) => ({
    active: payload,
  }),
  UPDATE_ACCOUNT: (
    state: AccountsState,
    {
      accountId,
      updater,
    }: {
      accountId: string;
      updater: (_: Account) => Account;
    },
  ): AccountsState => {
    function update(existingAccount) {
      if (accountId !== existingAccount.id) return existingAccount;
      return { ...existingAccount, ...updater(existingAccount) };
    }

    return {
      active: state.active.map(update),
    };
  },
  DELETE_ACCOUNT: (
    state: AccountsState,
    {
      payload: account,
    }: {
      payload: Account;
    },
  ): AccountsState => ({
    active: state.active.filter(acc => acc.id !== account.id),
  }),
  CLEAN_CACHE: (state: AccountsState): AccountsState => ({
    active: state.active.map(clearAccount),
  }),
  BLACKLIST_TOKEN: (
    state: AccountsState,
    {
      payload: tokenId,
    }: {
      payload: string;
    },
  ) => ({
    active: state.active.map(a => withoutToken(a, tokenId)),
  }),
  DANGEROUSLY_OVERRIDE_STATE: (state: AccountsState): AccountsState => ({
    ...state,
  }),
};
// Selectors
export const exportSelector = (s: any) => ({
  active: s.accounts.active.map(accountModel.encode),
});
export const accountsSelector = (s: any): Account[] => s.accounts.active;
export const migratableAccountsSelector = (s: any): Account[] =>
  s.accounts.active.filter(canBeMigrated);
export const flattenAccountsSelector = createSelector(
  accountsSelector,
  flattenAccounts,
);
export const flattenAccountsEnforceHideEmptyTokenSelector = createSelector(
  accountsSelector,
  accounts =>
    flattenAccounts(accounts, {
      enforceHideEmptyTokenAccounts: true,
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
  (_, { currency }) => currency,
  (accounts, currency): AccountLike[] => {
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
  (_, { currencies }) => currencies,
  (accounts, currencies): AccountLike[] =>
    currencies && currencies.length
      ? accounts.filter(a =>
          currencies.includes(
            a.type === "TokenAccount" ? a.token.id : a.currency.id,
          ),
        )
      : accounts,
);
const emptyArray = [];
export const accountsByCryptoCurrencyScreenSelector =
  (currency: CryptoCurrency) => (state: any) => {
    if (!currency) return emptyArray;
    return accountsTuplesByCurrencySelector(state, {
      currency,
    });
  };
export const flattenAccountsByCryptoCurrencyScreenSelector =
  (currency?: CryptoCurrency) => (state: any) => {
    if (!currency) return emptyArray;
    return flattenAccountsByCryptoCurrencySelector(state, {
      currencies: [currency.id],
    });
  };
export const accountCryptoCurrenciesSelector = createSelector(
  cryptoCurrenciesSelector,
  (_, { currencies }) => currencies,
  (cryptoCurrencies, currencies) =>
    currencies && currencies.length
      ? cryptoCurrencies.filter(c => currencies.includes(c.id))
      : cryptoCurrencies,
);
export const accountSelector = createSelector(
  accountsSelector,
  (_, { accountId }) => accountId,
  (accounts, accountId) => accounts.find(a => a.id === accountId),
);
export const parentAccountSelector = createSelector(
  accountsSelector,
  (_, { account }) => (account ? account.parentId : null),
  (accounts, accountId) => accounts.find(a => a.id === accountId),
);
export const accountScreenSelector = (route: any) => (state: any) => {
  const { accountId, parentId } = route.params;
  const parentAccount: Account | null | undefined =
    parentId &&
    accountSelector(state, {
      accountId: parentId,
    });
  let account: AccountLike | null | undefined = route.params.account;

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
export const subAccountByCurrencyOrderedSelector: OutputSelector<
  State,
  {
    currency: CryptoCurrency | TokenCurrency;
  },
  Array<{
    parentAccount: Account | null | undefined;
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
  (route: any) => (state: any) => {
    const currency = route?.params?.currency || {};
    if (!currency) return [];
    return subAccountByCurrencyOrderedSelector(state, {
      currency,
    });
  };
export const hasLendEnabledAccountsSelector: OutputSelector<
  State,
  void,
  boolean
> = createSelector(flattenAccountsSelector, accounts =>
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
export default handleActions(handlers, initialState);
