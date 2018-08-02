// @flow

import { handleActions } from "redux-actions";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker
} from "@ledgerhq/live-common/lib/helpers/currencies";
import { createSelector } from "reselect";
import type { CryptoCurrency, Currency } from "@ledgerhq/live-common/lib/types";

export const intermediaryCurrency = getCryptoCurrencyById("bitcoin");

export type SettingsState = {
  counterValue: string,
  counterValueExchange: ?string,
  authSecurityEnabled: boolean
};

const INITIAL_STATE: SettingsState = {
  counterValue: "USD",
  counterValueExchange: null,
  authSecurityEnabled: false
};

function asCryptoCurrency(c: Currency): ?CryptoCurrency {
  return "id" in c ? c : null;
}

const handlers: Object = {
  SETTINGS_IMPORT: (state: SettingsState, { settings }) => ({
    ...state,
    ...settings
  }),

  SETTINGS_SET_AUTH_SECURITY: (
    state: SettingsState,
    { authSecurityEnabled }
  ) => ({ ...state, authSecurityEnabled }),

  SETTINGS_SET_COUNTERVALUE: (state: SettingsState, { counterValue }) => ({
    ...state,
    counterValue,
    counterValueExchange: null // also reset the exchange
  }),

  SETTINGS_SET_PAIRS: (
    state: SettingsState,
    {
      pairs
    }: {
      pairs: Array<{
        from: Currency,
        to: Currency,
        exchange: string
      }>
    }
  ) => {
    const counterValueCurrency = counterValueCurrencyLocalSelector(state);
    const copy = { ...state };
    copy.currenciesSettings = { ...copy.currenciesSettings };
    for (const { to, from, exchange } of pairs) {
      const fromCrypto = asCryptoCurrency(from);
      if (fromCrypto && to.ticker === intermediaryCurrency.ticker) {
        copy.currenciesSettings[fromCrypto.id] = {
          ...copy.currenciesSettings[fromCrypto.id],
          exchange
        };
      } else if (
        from.ticker === intermediaryCurrency.ticker &&
        to.ticker === counterValueCurrency.ticker
      ) {
        copy.counterValueExchange = exchange;
      }
    }
    return copy;
  }
};

const storeSelector = (state: *): SettingsState => state.settings;

export const exportSelector = storeSelector;

const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");

export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector
);

const counterValueExchangeLocalSelector = (s: SettingsState) =>
  s.counterValueExchange;

export const counterValueExchangeSelector = createSelector(
  storeSelector,
  counterValueExchangeLocalSelector
);

export const currencySettingsSelector = (_s: *, _o: *) => ({
  exchange: "BINANCE"
}); // FIXME

export const authSecurityEnabledSelector = createSelector(
  storeSelector,
  s => s.authSecurityEnabled
);

export default handleActions(handlers, INITIAL_STATE);
