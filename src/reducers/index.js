// @flow
/* eslint import/no-cycle: 0 */
import { combineReducers } from "redux";

import accounts from "./accounts";
import CounterValues from "../countervalues";
import settings from "./settings";
import bridgeSync from "./bridgeSync";
import appstate from "./appstate";
import ble from "./ble";

import type { AccountsState } from "./accounts";
import type { SettingsState } from "./settings";
import type { BridgeSyncState } from "./bridgeSync";
import type { AppState } from "./appstate";
import type { BleState } from "./ble";

export type State = {
  accounts: AccountsState,
  countervalues: *,
  settings: SettingsState,
  bridgeSync: BridgeSyncState,
  appstate: AppState,
  ble: BleState,
};

export default combineReducers({
  accounts,
  countervalues: CounterValues.reducer,
  settings,
  bridgeSync,
  appstate,
  ble,
});
