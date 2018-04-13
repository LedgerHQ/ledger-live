// @flow
import { handleActions } from "redux-actions";
import { getFiatUnit, hasFiatUnit } from "@ledgerhq/currencies";
import Locale from "react-native-locale"; // eslint-disable-line import/no-unresolved
import type { State } from ".";

export type SettingsState = {
  counterValue: string,
  orderAccounts: string,
  deltaChangeColorLocale: "western" | "eastern",
  chartTimeRange: number
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
  chartTimeRange: 7
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
  })
};

export const fiatUnitSelector = (state: State) =>
  getFiatUnit(state.settings.counterValue);

export const chartTimeRangeSelector = (state: State) =>
  state.settings.chartTimeRange;

export default handleActions(handlers, state);
