// @flow

import { combineReducers } from "redux";

import accounts from "./accounts";
import CounterValues from "../countervalues";
import settings from "./settings";

import type { AccountsState } from "./accounts";
import type { SettingsState } from "./settings";

export type State = {
  accounts: AccountsState,
  countervalues: *,
  settings: SettingsState,
};

export default combineReducers({
  accounts,
  countervalues: CounterValues.reducer,
  settings,
});
