import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
import { combineReducers, type Store } from "redux";
import { llmRTKApiReducers } from "~/context/rtkQueryApi";
import accounts from "./accounts";
import appstate from "./appstate";
import auth from "./auth";
import ble from "./ble";
import countervalues from "./countervalues";
import dynamicContent from "./dynamicContent";
import earn from "./earn";
import inView from "./inView";
import largeMover from "./largeMover";
import market from "./market";
import modularDrawer from "./modularDrawer";
import receiveOptionsDrawer from "./receiveOptionsDrawer";
import transferDrawer from "./transferDrawer";
import notifications from "./notifications";
import protect from "./protect";
import ratings from "./ratings";
import settings from "./settings";
import sendFlow from "./sendFlow";
import toasts from "./toast";
import trustchain from "./trustchain";
import type { State } from "./types";
import wallet from "./wallet";
import walletconnect from "./walletconnect";
import walletSync from "./walletSync";
import { identitiesSlice } from "@ledgerhq/client-ids/store";
import type { UnknownAction } from "@reduxjs/toolkit";

export type AppStore = Store<State>;

const appReducer = combineReducers({
  accounts,
  appstate,
  auth,
  ble,
  countervalues,
  dynamicContent,
  earn,
  identities: identitiesSlice.reducer,
  inView,
  largeMover,
  market,
  modularDrawer,
  receiveOptionsDrawer,
  transferDrawer,
  notifications,
  postOnboarding,
  protect,
  ratings,
  settings,
  sendFlow,
  toasts,
  trustchain,
  wallet,
  walletconnect,
  walletSync,
  ...llmRTKApiReducers,
});

// TODO: EXPORT ALL POSSIBLE ACTION TYPES AND USE ACTION<TYPES>
const rootReducer = (state: State | undefined, action: UnknownAction) => {
  return appReducer(state, action);
};

export default rootReducer;
