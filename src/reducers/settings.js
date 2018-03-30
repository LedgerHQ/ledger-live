// @flow
import { handleActions } from "redux-actions";
import { getFiatUnit } from "@ledgerhq/currencies";
import type { State } from ".";

export type SettingsState = {
  counterValue: string,
  orderAccounts: string,
  deltaChangeColorLocale: "western" | "eastern"
};

const defaultState: SettingsState = {
  counterValue: "USD",
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
