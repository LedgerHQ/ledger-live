// @flow

import { combineReducers } from "redux";

import accounts from "./accounts";
import CounterValues from "../countervalues";
import settings from "./settings";
import bridgeSync from "./bridgeSync";

import type { AccountsState } from "./accounts";
import type { SettingsState } from "./settings";
import type { BridgeSyncState } from "./bridgeSync";

export type State = {
  accounts: AccountsState,
  countervalues: *,
  settings: SettingsState,
  bridgeSync: BridgeSyncState,
};

export default combineReducers({
  accounts,
  countervalues: CounterValues.reducer,
  settings,
  bridgeSync,
});
