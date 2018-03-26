// @flow

import { handleActions } from "redux-actions";

import get from "lodash/get";

export type SettingsState = Object;

const defaultState: SettingsState = {
  counterValue: "USD",
  language: "en",
  orderAccounts: "balance|desc"
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

export const getCounterValue = (state: Object) =>
  get(state.settings, "counterValue", defaultState.counterValue);

export const getLanguage = (state: Object) =>
  get(state.settings, "language", defaultState.language);

export const getOrderAccounts = (state: Object) =>
  get(state.settings, "orderAccounts", defaultState.orderAccounts);

export default handleActions(handlers, state);
