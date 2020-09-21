// @flow
/* eslint import/no-cycle: 0 */
import { combineReducers } from "redux";

import accounts from "./accounts";
import CounterValues from "../countervalues";
import settings from "./settings";
import appstate from "./appstate";
import ble from "./ble";

import type { AccountsState } from "./accounts";
import type { SettingsState } from "./settings";
import type { AppState } from "./appstate";
import type { BleState } from "./ble";

export type State = {
  accounts: AccountsState,
  countervalues: *,
  settings: SettingsState,
  appstate: AppState,
  ble: BleState,
};

// $FlowFixMe
const appReducer = combineReducers({
  accounts,
  countervalues: CounterValues.reducer,
  settings,
  appstate,
  ble,
});

const rootReducer = (state: State, action: *) => {
  if (__DEV__ && action.type === "DANGEROUSLY_OVERRIDE_STATE") {
    appReducer({ ...action.payload }, action);
  }

  return appReducer(state, action);
};

export default rootReducer;
