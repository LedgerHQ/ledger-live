import { combineReducers } from "redux";
import accounts from "./accounts";
import settings from "./settings";
import appstate from "./appstate";
import ble from "./ble";
import ratings from "./ratings";
import notifications from "./notifications";
import walletconnect from "./walletconnect";
import type { AccountsState } from "./accounts";
import type { SettingsState } from "./settings";
import type { AppState } from "./appstate";
import type { BleState } from "./ble";
import type { RatingsState } from "./ratings";
import type { NotificationsState } from "./notifications";
import type { WalletConnectState } from "./walletconnect";

export type State = {
  accounts: AccountsState;
  settings: SettingsState;
  appstate: AppState;
  ble: BleState;
  ratings: RatingsState;
  notifications: NotificationsState;
  walletconnect: WalletConnectState;
};

const appReducer = combineReducers({
  accounts,
  settings,
  appstate,
  ble,
  ratings,
  notifications,
  walletconnect,
});

const rootReducer = (state: State, action: any) => {
  if (__DEV__ && action.type === "DANGEROUSLY_OVERRIDE_STATE") {
    appReducer({ ...action.payload }, action);
  }

  return appReducer(state, action);
};

export default rootReducer;
