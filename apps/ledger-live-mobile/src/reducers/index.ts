import { combineReducers, Store } from "redux";
import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
import accounts from "./accounts";
import settings from "./settings";
import appstate from "./appstate";
import ble from "./ble";
import ratings from "./ratings";
import notifications from "./notifications";
import swap from "./swap";
import earn from "./earn";
import dynamicContent from "./dynamicContent";
import walletconnect from "./walletconnect";
import protect from "./protect";
import nft from "./nft";
import market from "./market";
import wallet from "./wallet";
import trustchain from "./trustchain";
import walletSync from "./walletSync";
import { State } from "./types";
import { ActionsPayload } from "../actions/types";
import largeMover from "./largeMover";

export type AppStore = Store<State>;

const appReducer = combineReducers({
  accounts,
  settings,
  appstate,
  ble,
  ratings,
  dynamicContent,
  notifications,
  swap,
  earn,
  walletconnect,
  postOnboarding,
  protect,
  nft,
  wallet,
  market,
  trustchain,
  walletSync,
  largeMover,
});

// TODO: EXPORT ALL POSSIBLE ACTION TYPES AND USE ACTION<TYPES>
const rootReducer = (state: State | undefined, action: ActionsPayload) => {
  return appReducer(state, action);
};

export default rootReducer;
