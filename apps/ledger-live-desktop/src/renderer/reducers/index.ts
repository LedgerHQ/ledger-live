import { combineReducers } from "redux";
import accounts, { AccountsState } from "./accounts";
import application, { ApplicationState } from "./application";
import devices, { DevicesState } from "./devices";
import modals, { ModalsState } from "./modals";
import UI, { UIState } from "./UI";
import settings, { SettingsState } from "./settings";
import swap, { SwapStateType } from "./swap";
import { PostOnboardingState } from "@ledgerhq/types-live";
import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
export type State = {
  accounts: AccountsState;
  application: ApplicationState;
  devices: DevicesState;
  modals: ModalsState;
  settings: SettingsState;
  UI: UIState;
  swap: SwapStateType;
  postOnboarding: PostOnboardingState;
};

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
