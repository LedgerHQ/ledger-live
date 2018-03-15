// @flow

import { combineReducers } from "redux";

import accounts from "./accounts";
import counterValues from "./counterValues";
import settings from "./settings";

import type { AccountsState } from "./accounts";
import type { CounterValuesState } from "./counterValues";
import type { SettingsState } from "./settings";

export type State = {
  accounts: AccountsState,
  counterValues: CounterValuesState,
  settings: SettingsState
};

export default combineReducers({
  // $FlowFixMe : not sure what's going on with accounts type
  accounts,
  counterValues,
  settings
});
