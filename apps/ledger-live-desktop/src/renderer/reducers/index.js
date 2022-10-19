// @flow
import { combineReducers } from "redux";
import accounts from "./accounts";
import application from "./application";
import devices from "./devices";
import modals from "./modals";
import UI from "./UI";
import settings from "./settings";
import swap from "./swap";
import type { AccountsState } from "./accounts";
import type { ApplicationState } from "./application";
import type { DevicesState } from "./devices";
import type { ModalsState } from "./modals";
import type { SettingsState } from "./settings";
import type { UIState } from "./UI";
import type { SwapStateType } from "./swap";
import type { PostOnboardingState } from "@ledgerhq/types-live";
import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";

export type State = {
  accounts: AccountsState,
  application: ApplicationState,
  devices: DevicesState,
  modals: ModalsState,
  settings: SettingsState,
  UI: UIState,
  swap: SwapStateType,
  postOnboarding: PostOnboardingState,
};

// $FlowFixMe
export default combineReducers({
  accounts,
  application,
  devices,
  modals,
  settings,
  UI,
  postOnboarding,
  swap,
});
