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
import trustchain from "./trustchain";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getEnv } from "@ledgerhq/live-env";
import countervalues, { CountervaluesState } from "./countervalues";
import { assetsDataApi } from "@ledgerhq/live-common/modularDrawer/data/state-manager/api";
import modularDrawer, { ModularDrawerState } from "./modularDrawer";

export type State = {
  accounts: AccountsState;
  application: ApplicationState;
  assetsDataApi: ReturnType<typeof assetsDataApi.reducer>;
  countervalues: CountervaluesState;
  devices: DevicesState;
  dynamicContent: DynamicContentState;
  market: MarketState;
  modals: ModalsState;
  modularDrawer: ModularDrawerState;
  postOnboarding: PostOnboardingState;
  settings: SettingsState;
  swap: SwapStateType;
  trustchain: TrustchainStore;
  UI: UIState;
  wallet: WalletState;
  walletSync: WalletSyncState;
};

export default combineReducers({
  accounts,
  application,
  assetsDataApi: assetsDataApi.reducer,
  countervalues,
  devices,
  dynamicContent,
  modals,
  modularDrawer,
  settings,
  UI,
  postOnboarding,
  swap,
  market,
  wallet,
  walletSync,
  trustchain,
  ...(getEnv("PLAYWRIGHT_RUN") && { lastAction: (_, action) => action }),
});
