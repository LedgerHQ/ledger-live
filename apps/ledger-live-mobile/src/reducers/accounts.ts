import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
import { createSelector } from "reselect";
import uniq from "lodash/uniq";
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
import { AccountsActionTypes, SettingsActionTypes } from "../actions/types";
import accountModel from "../logic/accountModel";

const initialState: AccountsState = {
  active: [],
};
const handlers = {
  [AccountsActionTypes.ACCOUNTS_IMPORT]: (
    _: AccountsState,
    { payload }: Action<AccountsImportStorePayload>,
  ) => payload,

  [AccountsActionTypes.ACCOUNTS_USER_IMPORT]: (
    s: AccountsState,
    { payload }: Action<AccountsImportAccountsPayload>,
  ): AccountsState => ({
    active: importAccountsReduce(s.active, payload.input),
  }),

  [AccountsActionTypes.REORDER_ACCOUNTS]: (
    state: AccountsState,
    { payload: { comparator } }: Action<AccountsReorderPayload>,
  ) => ({
    active: nestedSortAccounts(state.active, comparator),
  }),

  [AccountsActionTypes.ACCOUNTS_ADD]: (
    s: AccountsState,
    {
      payload: { scannedAccounts, selectedIds, renamings },
    }: Action<AccountsReplaceAccountsPayload>,
  ) => ({
    active: addAccounts({
      existingAccounts: s.active,
      scannedAccounts,
      selectedIds,
      renamings,
    }),
  }),

  [AccountsActionTypes.SET_ACCOUNTS]: (
    _: AccountsState,
    { payload }: Action<AccountsSetAccountsPayload>,
  ) => payload,

  [AccountsActionTypes.UPDATE_ACCOUNT]: (
    state: AccountsState,
    {
      payload: { accountId, updater },
    }: Action<AccountsUpdateAccountWithUpdaterPayload>,
  ) => {
    function update(existingAccount: Account) {
      if (accountId !== existingAccount.id) return existingAccount;
      return { ...existingAccount, ...updater(existingAccount) };
    }

    return {
      active: state.active.map(update),
    };
  },

  [AccountsActionTypes.DELETE_ACCOUNT]: (
    state: AccountsState,
    { payload: account }: Action<AccountsDeleteAccountPayload>,
  ) => ({
    active: state.active.filter(acc => acc.id !== account.id),
  }),

  [AccountsActionTypes.CLEAN_CACHE]: (state: AccountsState) => ({
    active: state.active.map(clearAccount),
  }),

  [SettingsActionTypes.BLACKLIST_TOKEN]: (
    state: AccountsState,
    { payload: tokenId }: Action<SettingsBlacklistTokenPayload>,
  ) => ({
    active: state.active.map(a => withoutToken(a, tokenId)),
  }),

  [AccountsActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (state: AccountsState) => ({
    ...state,
  }),
};

// Selectors
export const exportSelector = (s: State) => ({
  active: s.accounts.active.map(accountModel.encode),
});
export const accountsSelector = (s: State) => s.accounts.active;
export const migratableAccountsSelector = (s: State) =>
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
    // ): { account: AccountLike; subAccount: SubAccount | null }[] => {
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
    return accountsTuplesByCurrencySelector(state, {
      currency,
    });
  };
export const flattenAccountsByCryptoCurrencyScreenSelector =
  (currency?: CryptoCurrency) => (state: State) => {
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
  (_: State, { accountId }: { accountId: string }) => accountId,
  (accounts, accountId) => accounts.find(a => a.id === accountId),
);
export const parentAccountSelector = createSelector(
  accountsSelector,
  (_: State, { account }: { account: SubAccount }) =>
    account ? account.parentId : null,
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
export const subAccountByCurrencyOrderedSelector = createSelector(
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
  (route: any) => (state: State) => {
    const currency = route?.params?.currency || {};
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

type Payload = AccountsPayload & SettingsBlacklistTokenPayload;

export default handleActions<AccountsState, Payload>(handlers, initialState);
