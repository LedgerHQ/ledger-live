import { combineReducers, Store } from "redux";
// import { Action } from "redux-actions"; TODO: SEE BELOW
import accounts from "./accounts";
import settings from "./settings";
import appstate from "./appstate";
import ble from "./ble";
import ratings from "./ratings";
import notifications from "./notifications";
import walletconnect from "./walletconnect";
import { State } from "../types/state";

export type AppStore = Store<State>;

const appReducer = combineReducers({
  accounts,
  settings,
  appstate,
  ble,
  ratings,
  notifications,
  walletconnect,
});

// TODO: EXPORT ALL POSSIBLE ACTION TYPES AND USE ACTION<TYPES>
const rootReducer = (state: State, action: any) => {
  if (__DEV__ && action.type === "DANGEROUSLY_OVERRIDE_STATE") {
    appReducer({ ...action.payload }, action);
  }

  return appReducer(state, action);
};

export default rootReducer;
