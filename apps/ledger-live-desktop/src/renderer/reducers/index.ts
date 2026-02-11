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
import manager, { ManagerState } from "./manager";
import market, { MarketState } from "./market";
import wallet from "./wallet";
import { WalletState } from "@ledgerhq/live-wallet/store";
import walletSync, { WalletSyncState } from "./walletSync";
import trustchain from "./trustchain";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getEnv } from "@ledgerhq/live-env";
import countervalues, { CountervaluesState } from "./countervalues";
import modularDrawer, { ModularDrawerState } from "./modularDrawer";
import sendFlow, { SendFlowState } from "./sendFlow";
import onboarding, { OnboardingState } from "./onboarding";
import { lldRTKApiReducers, LLDRTKApiState } from "./rtkQueryApi";
import { identitiesSlice, IdentitiesState } from "@ledgerhq/client-ids/store";
import type { PayloadAction, UnknownAction } from "@reduxjs/toolkit";
import zcashSync, { ZcashSyncState } from "./zcashSync";

export type State = LLDRTKApiState & {
  accounts: AccountsState;
  application: ApplicationState;
  countervalues: CountervaluesState;
  devices: DevicesState;
  dynamicContent: DynamicContentState;
  identities: IdentitiesState;
  manager: ManagerState;
  market: MarketState;
  modals: ModalsState;
  modularDrawer: ModularDrawerState;
  sendFlow: SendFlowState;
  onboarding: OnboardingState;
  postOnboarding: PostOnboardingState;
  settings: SettingsState;
  trustchain: TrustchainStore;
  UI: UIState;
  wallet: WalletState;
  walletSync: WalletSyncState;
  zcashSync: ZcashSyncState;
};

const appReducer = combineReducers({
  accounts,
  application,
  countervalues,
  devices,
  dynamicContent,
  identities: identitiesSlice.reducer,
  manager,
  modals,
  modularDrawer,
  sendFlow,
  settings,
  UI,
  onboarding,
  postOnboarding,
  market,
  wallet,
  walletSync,
  trustchain,
  zcashSync,
  ...lldRTKApiReducers,
  ...(getEnv("PLAYWRIGHT_RUN") && { lastAction: (_: unknown, action: PayloadAction) => action }),
});

const rootReducer = (state: State | undefined, action: UnknownAction) => {
  return appReducer(state, action);
};

export default rootReducer;
