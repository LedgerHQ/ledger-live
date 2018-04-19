// @flow
import { handleActions } from "redux-actions";
import { getFiatUnit, hasFiatUnit } from "@ledgerhq/currencies";
import type { Currency } from "@ledgerhq/currencies";
import Locale from "react-native-locale"; // eslint-disable-line import/no-unresolved
import type { State } from ".";

export type CurrencySettings = {
  confirmations: number,
  confirmationsToSpend: number,
  transactionFees: string,
  blockchainExplorer: string
};

export type CurrenciesSettings = {
  [coinType: number]: CurrencySettings
};

export type SettingsState = {
  counterValue: string,
  orderAccounts: string,
  deltaChangeColorLocale: "western" | "eastern",
  chartTimeRange: number,
  currenciesSettings: CurrenciesSettings
};

const locale = Locale.constants();

const getLocaleFiat = () =>
  hasFiatUnit(locale.currencyCode) ? locale.currencyCode : "USD";

const getLocaleColor = () => {
  const eastern = ["KR", "JP", "CN", "KP"];

  return eastern.indexOf(locale.countryCode) !== -1 ? "eastern" : "western";
};

const defaultState: SettingsState = {
  counterValue: getLocaleFiat(),
  orderAccounts: "balance|desc",
  deltaChangeColorLocale: getLocaleColor(),
  chartTimeRange: 7,
  currenciesSettings: {}
};

const state: SettingsState = {
  ...defaultState
};

const handlers: Object = {
  SAVE_SETTINGS: (
    state: SettingsState,
    { payload: settings }: { payload: * }
  ) => ({
    ...state,
    ...settings
  }),
  FETCH_SETTINGS: (
    state: SettingsState,
    { payload: settings }: { payload: * }
  ) => ({
    ...state,
    ...settings
  }),
  UPDATE_CURRENCY_SETTINGS: (
    { currenciesSettings, ...state }: SettingsState,
    { coinType, patch }
  ) => ({
    ...state,
    currenciesSettings: {
      ...currenciesSettings,
      [coinType]: { ...currenciesSettings[coinType], ...patch }
    }
  })
};

export const defaultCurrencySettingsForCurrency = (
  _currency: Currency
): CurrencySettings => ({
  confirmations: 5,
  confirmationsToSpend: 10,
  transactionFees: "high",
  blockchainExplorer: "blockchain.info"
});

export const currencySettingsSelector = (state: State, currency: Currency) => ({
  ...defaultCurrencySettingsForCurrency(currency),
  ...state.settings.currenciesSettings[currency.coinType]
});

export const fiatUnitSelector = (state: State) =>
  getFiatUnit(state.settings.counterValue);

export const chartTimeRangeSelector = (state: State) =>
  state.settings.chartTimeRange;

export default handleActions(handlers, state);
