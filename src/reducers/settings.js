// @flow

import { handleActions } from "redux-actions";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/lib/helpers/currencies";
import { createSelector } from "reselect";
import type { CryptoCurrency, Currency } from "@ledgerhq/live-common/lib/types";

export const intermediaryCurrency = getCryptoCurrencyById("bitcoin");

export type CurrencySettings = {
  confirmationsNb: number,
  exchange: ?*,
};

export type SettingsState = {
  counterValue: string,
  counterValueExchange: ?string,
  authSecurityEnabled: boolean,
  reportErrorsEnabled: boolean,
  analyticsEnabled: boolean,
  currenciesSettings: {
    [currencyId: string]: CurrencySettings,
  },
};

const INITIAL_STATE: SettingsState = {
  counterValue: "USD",
  counterValueExchange: null,
  authSecurityEnabled: false,
  reportErrorsEnabled: false,
  analyticsEnabled: false,
  currenciesSettings: {},
};

function asCryptoCurrency(c: Currency): ?CryptoCurrency {
  return "id" in c ? c : null;
}

const handlers: Object = {
  SETTINGS_IMPORT: (state: SettingsState, { settings }) => ({
    ...state,
    ...settings,
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

export const currencySettingsSelector = (s: *, { currency }: *) => ({
  exchange: null,
  ...s.settings.currenciesSettings[currency.id],
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

export default handleActions(handlers, INITIAL_STATE);
