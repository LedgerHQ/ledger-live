// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import merge from "lodash/merge";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/lib/currencies";
import { createSelector } from "reselect";
import type {
  CryptoCurrency,
  Currency,
  Account,
} from "@ledgerhq/live-common/lib/types";
import type { State } from ".";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";

export const intermediaryCurrency = getCryptoCurrencyById("bitcoin");

export type CurrencySettings = {
  confirmationsNb: number,
  exchange: ?*,
};

export const timeRangeDaysByKey = {
  week: 7,
  month: 30,
  year: 365,
};

export type TimeRange = $Keys<typeof timeRangeDaysByKey>;

export type SettingsState = {
  counterValue: string,
  counterValueExchange: ?string,
  authSecurityEnabled: boolean,
  reportErrorsEnabled: boolean,
  analyticsEnabled: boolean,
  currenciesSettings: {
    [currencyId: string]: CurrencySettings,
  },
  selectedTimeRange: TimeRange,
  orderAccounts: string,
};

const INITIAL_STATE: SettingsState = {
  counterValue: "USD",
  counterValueExchange: null,
  authSecurityEnabled: false,
  reportErrorsEnabled: false,
  analyticsEnabled: false,
  currenciesSettings: {},
  selectedTimeRange: "month",
  orderAccounts: "balance|desc",
};

function asCryptoCurrency(c: Currency): ?CryptoCurrency {
  return "id" in c ? c : null;
}

const handlers: Object = {
  SETTINGS_IMPORT: (state: SettingsState, { settings }) => ({
    ...state,
    ...settings,
  }),
  SETTINGS_IMPORT_DESKTOP: (state: SettingsState, { settings }) => ({
    ...state,
    ...settings,
    currenciesSettings: merge(
      state.currenciesSettings,
      settings.currenciesSettings,
    ),
  }),
  UPDATE_CURRENCY_SETTINGS: (
    { currenciesSettings, ...state }: SettingsState,
    { currencyId, patch },
  ) => ({
    ...state,
    currenciesSettings: {
      ...currenciesSettings,
      [currencyId]: { ...currenciesSettings[currencyId], ...patch },
    },
  }),
  SETTINGS_SET_AUTH_SECURITY: (
    state: SettingsState,
    { authSecurityEnabled },
  ) => ({ ...state, authSecurityEnabled }),

  SETTINGS_SET_REPORT_ERRORS: (
    state: SettingsState,
    { reportErrorsEnabled },
  ) => ({
    ...state,
    reportErrorsEnabled,
  }),

  SETTINGS_SET_ANALYTICS: (state: SettingsState, { analyticsEnabled }) => ({
    ...state,
    analyticsEnabled,
  }),

  SETTINGS_SET_COUNTERVALUE: (state: SettingsState, { counterValue }) => ({
    ...state,
    counterValue,
    counterValueExchange: null, // also reset the exchange
  }),

  SETTINGS_SET_ORDER_ACCOUNTS: (state: SettingsState, { orderAccounts }) => ({
    ...state,
    orderAccounts,
  }),

  SETTINGS_SET_PAIRS: (
    state: SettingsState,
    {
      pairs,
    }: {
      pairs: Array<{
        from: Currency,
        to: Currency,
        exchange: *,
      }>,
    },
  ) => {
    const counterValueCurrency = counterValueCurrencyLocalSelector(state);
    const copy = { ...state };
    copy.currenciesSettings = { ...copy.currenciesSettings };
    for (const { to, from, exchange } of pairs) {
      const fromCrypto = asCryptoCurrency(from);
      if (fromCrypto && to.ticker === intermediaryCurrency.ticker) {
        copy.currenciesSettings[fromCrypto.id] = {
          ...copy.currenciesSettings[fromCrypto.id],
          exchange,
        };
      } else if (
        from.ticker === intermediaryCurrency.ticker &&
        to.ticker === counterValueCurrency.ticker
      ) {
        copy.counterValueExchange = exchange;
      }
    }
    return copy;
  },

  SETTINGS_SET_SELECTED_TIME_RANGE: (
    state,
    { payload: selectedTimeRange },
  ) => ({
    ...state,
    selectedTimeRange,
  }),
};

const storeSelector = (state: *): SettingsState => state.settings;

export const exportSelector = storeSelector;

const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");

export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector,
);

const counterValueExchangeLocalSelector = (s: SettingsState) =>
  s.counterValueExchange;

export const counterValueExchangeSelector = createSelector(
  storeSelector,
  counterValueExchangeLocalSelector,
);

const defaultCurrencySettingsForCurrency: CryptoCurrency => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb
      ? defaults.confirmationsNb.def
      : 0,
    exchange: null,
  };
};

export const currencySettingsSelector = (
  state: State,
  { currency }: { currency: Currency },
) => ({
  exchange: null,
  ...defaultCurrencySettingsForCurrency(currency),
  ...state.settings.currenciesSettings[currency.id],
});

export const authSecurityEnabledSelector = createSelector(
  storeSelector,
  s => s.authSecurityEnabled,
);

export const reportErrorsEnabledSelector = createSelector(
  storeSelector,
  s => s.reportErrorsEnabled,
);

export const analyticsEnabledSelector = createSelector(
  storeSelector,
  s => s.analyticsEnabled,
);

export const currencySettingsForAccountSelector = (
  s: *,
  { account }: { account: Account },
) => currencySettingsSelector(s, { currency: account.currency });

export const exchangeSettingsForAccountSelector = createSelector(
  currencySettingsForAccountSelector,
  settings => settings.exchange,
);

export const selectedTimeRangeSelector = (state: State) =>
  state.settings.selectedTimeRange;

export const orderAccountsSelector = (state: State) =>
  state.settings.orderAccounts;

export default handleActions(handlers, INITIAL_STATE);
