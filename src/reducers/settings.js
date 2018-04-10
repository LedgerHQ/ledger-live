// @flow
import { handleActions } from "redux-actions";
import { getFiatUnit, hasFiatUnit } from "@ledgerhq/currencies";
import Locale from "react-native-locale"; // eslint-disable-line import/no-unresolved
import type { State } from ".";

export type SettingsState = {
  counterValue: string,
  orderAccounts: string,
  deltaChangeColorLocale: "western" | "eastern"
};

const getLocaleCurrency = () => {
  const localeCurrency = Locale.constants().currencyCode;

  return hasFiatUnit(localeCurrency) ? localeCurrency : "USD";
};

const defaultState: SettingsState = {
  counterValue: getLocaleCurrency(),
  orderAccounts: "balance|desc",
  deltaChangeColorLocale: "western"
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

export default handleActions(handlers, state);
