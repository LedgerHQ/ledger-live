import { combineReducers } from "redux";
import accounts, { AccountsState } from "./accounts";
import application, { ApplicationState } from "./application";
import devices, { DevicesState } from "./devices";
import dynamicContent, { DynamicContentState } from "./dynamicContent";
import modals, { ModalsState } from "./modals";
import UI, { UIState } from "./UI";
import settings, { SettingsState } from "./settings";
import { PostOnboardingState } from "@ledgerhq/types-live";
import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
import market, { MarketState } from "./market";
import wallet from "./wallet";
import { WalletState } from "@ledgerhq/live-wallet/store";
import walletSync, { WalletSyncState } from "./walletSync";
import walletSyncUserState, { WalletSyncUserStateState } from "./walletSyncUserState";
import trustchain from "./trustchain";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getEnv } from "@ledgerhq/live-env";
import countervalues, { CountervaluesState } from "./countervalues";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
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
  trustchain: TrustchainStore;
  UI: UIState;
  wallet: WalletState;
  walletSync: WalletSyncState;
  walletSyncUserState: WalletSyncUserStateState;
};

export default combineReducers({
  accounts,
  application,
  assetsDataApi: assetsDataApi.reducer,
  countervalues,
  devices,
  dynamicContent,
  market,
  modals,
  modularDrawer,
  postOnboarding,
  settings,
  trustchain,
  UI,
  wallet,
  walletSync,
  walletSyncUserState,
  ...(getEnv("PLAYWRIGHT_RUN") && { lastAction: (_, action) => action }),
});
