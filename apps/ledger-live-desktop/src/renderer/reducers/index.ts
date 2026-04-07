import { combineReducers } from "redux";
import featureFlags, { type FeatureFlagsState } from "@shared/feature-flags";
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
import trustchain from "./trustchain";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getEnv } from "@ledgerhq/live-env";
import countervalues, { CountervaluesState } from "./countervalues";
import modularDialog, { ModularDialogState } from "./modularDialog";
import sendFlow, { SendFlowState } from "./sendFlow";
import onboarding, { OnboardingState } from "./onboarding";
import { lldRTKApiReducers, LLDRTKApiState } from "./rtkQueryApi";
import { identitiesSlice, IdentitiesState } from "@ledgerhq/client-ids/store";
import type { PayloadAction, UnknownAction } from "@reduxjs/toolkit";
import dialogs, { DialogsState } from "./dialogs";
import syncRefresh, { SyncRefreshState } from "./syncRefresh";
import shieldedSyncSubscriptions, {
  ShieldedSyncSubscriptionsState,
} from "./shieldedSyncSubscriptions";
import countervaluesExtraTracking, {
  CountervaluesExtraTrackingState,
} from "./countervaluesExtraTracking";

export type State = LLDRTKApiState & {
  accounts: AccountsState;
  application: ApplicationState;
  countervalues: CountervaluesState;
  devices: DevicesState;
  dynamicContent: DynamicContentState;
  featureFlags: FeatureFlagsState;
  identities: IdentitiesState;
  market: MarketState;
  modals: ModalsState;
  modularDialog: ModularDialogState;
  sendFlow: SendFlowState;
  onboarding: OnboardingState;
  postOnboarding: PostOnboardingState;
  settings: SettingsState;
  trustchain: TrustchainStore;
  UI: UIState;
  wallet: WalletState;
  walletSync: WalletSyncState;
  dialogs: DialogsState;
  syncRefresh: SyncRefreshState;
  shieldedSyncSubscriptions: ShieldedSyncSubscriptionsState;
  countervaluesExtraTracking: CountervaluesExtraTrackingState;
};

const appReducer = combineReducers({
  accounts,
  application,
  countervalues,
  devices,
  dynamicContent,
  featureFlags,
  identities: identitiesSlice.reducer,
  modals,
  modularDialog,
  sendFlow,
  settings,
  UI,
  onboarding,
  postOnboarding,
  market,
  wallet,
  walletSync,
  trustchain,
  dialogs,
  syncRefresh,
  shieldedSyncSubscriptions,
  countervaluesExtraTracking,
  ...lldRTKApiReducers,
  ...(getEnv("PLAYWRIGHT_RUN") && { lastAction: (_: unknown, action: PayloadAction) => action }),
});

const rootReducer = (state: State | undefined, action: UnknownAction) => {
  return appReducer(state, action);
};

export default rootReducer;
