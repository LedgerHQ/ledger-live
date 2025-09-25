import { assetsDataApi } from "@ledgerhq/live-common/modularDrawer/data/state-manager/api";
import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
import { combineReducers, Store } from "redux";
import { ActionsPayload } from "../actions/types";
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
import tools from "./tools";
import notifications from "./notifications";
import protect from "./protect";
import ratings from "./ratings";
import settings from "./settings";
import swap from "./swap";
import toasts from "./toast";
import trustchain from "./trustchain";
import { State } from "./types";
import wallet from "./wallet";
import walletconnect from "./walletconnect";
import walletSync from "./walletSync";
import walletSyncUserState from "./walletSyncUserState";

export type AppStore = Store<State>;

const appReducer = combineReducers({
  accounts,
  appstate,
  assetsDataApi: assetsDataApi.reducer,
  auth,
  ble,
  countervalues,
  dynamicContent,
  earn,
  inView,
  largeMover,
  market,
  modularDrawer,
  tools,
  notifications,
  postOnboarding,
  protect,
  ratings,
  settings,
  swap,
  toasts,
  trustchain,
  wallet,
  walletconnect,
  walletSync,
  walletSyncUserState,
});

// TODO: EXPORT ALL POSSIBLE ACTION TYPES AND USE ACTION<TYPES>
const rootReducer = (state: State | undefined, action: ActionsPayload) => {
  return appReducer(state, action);
};

export default rootReducer;
