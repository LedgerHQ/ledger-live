import { combineReducers } from "redux";
import accounts, { AccountsState } from "./accounts";
import application, { ApplicationState } from "./application";
import devices, { DevicesState } from "./devices";
import dynamicContent, { DynamicContentState } from "./dynamicContent";
import modals, { ModalsState } from "./modals";
import UI, { UIState } from "./UI";
import settings, { SettingsState } from "./settings";
import swap, { SwapStateType } from "./swap";
import { PostOnboardingState } from "@ledgerhq/types-live";
import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
import market, { MarketState } from "./market";
import wallet from "./wallet";
import { WalletState } from "@ledgerhq/live-wallet/store";
import walletSync, { WalletSyncState } from "./walletSync";

export type State = {
  accounts: AccountsState;
  application: ApplicationState;
  devices: DevicesState;
  dynamicContent: DynamicContentState;
  modals: ModalsState;
  settings: SettingsState;
  UI: UIState;
  swap: SwapStateType;
  postOnboarding: PostOnboardingState;
  market: MarketState;
  wallet: WalletState;
  walletSync: WalletSyncState;
};

export default combineReducers({
  accounts,
  application,
  devices,
  dynamicContent,
  modals,
  settings,
  UI,
  postOnboarding,
  swap,
  market,
  wallet,
  walletSync,
});
