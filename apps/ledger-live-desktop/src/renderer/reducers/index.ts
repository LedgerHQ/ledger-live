import { combineReducers } from "redux";
import featureFlags, { type FeatureFlagsState } from "@shared/feature-flags";
import accounts, { AccountsState } from "./accounts";
import application, { ApplicationState } from "./application";
import devices, { DevicesState } from "./devices";
import dynamicContent, { DynamicContentState } from "./dynamicContent";
import history, { HistoryState } from "./history";
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
import ptxInfoDialog, { PtxInfoDialogState } from "./ptxInfoDialog";
import actionDialog, { ActionDialogState } from "./actionDialog";
import liveAppModal, { LiveAppModalState } from "./liveAppModal";
import syncRefresh, { SyncRefreshState } from "./syncRefresh";
import shieldedSyncSubscriptions, {
  ShieldedSyncSubscriptionsState,
} from "./shieldedSyncSubscriptions";
import countervaluesExtraTracking, {
  CountervaluesExtraTrackingState,
} from "./countervaluesExtraTracking";
import { recoverStateReducer, RecoverStateSliceState } from "./recoverState";
import genericAwarenessModal, {
  GenericAwarenessModalSliceState,
} from "./genericAwarenessModalSlice";

export type State = LLDRTKApiState & {
  accounts: AccountsState;
  application: ApplicationState;
  countervalues: CountervaluesState;
  devices: DevicesState;
  dynamicContent: DynamicContentState;
  featureFlags: FeatureFlagsState;
  history: HistoryState;
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
  ptxInfoDialog: PtxInfoDialogState;
  actionDialog: ActionDialogState;
  liveAppModal: LiveAppModalState;
  syncRefresh: SyncRefreshState;
  shieldedSyncSubscriptions: ShieldedSyncSubscriptionsState;
  countervaluesExtraTracking: CountervaluesExtraTrackingState;
  recoverState: RecoverStateSliceState;
  genericAwarenessModal: GenericAwarenessModalSliceState;
};

const appReducer = combineReducers({
  accounts,
  application,
  countervalues,
  devices,
  dynamicContent,
  featureFlags,
  history,
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
  ptxInfoDialog,
  actionDialog,
  liveAppModal,
  syncRefresh,
  shieldedSyncSubscriptions,
  countervaluesExtraTracking,
  recoverState: recoverStateReducer,
  genericAwarenessModal,
  ...lldRTKApiReducers,
  ...(getEnv("PLAYWRIGHT_RUN") && { lastAction: (_: unknown, action: PayloadAction) => action }),
});

const rootReducer = (state: State | undefined, action: UnknownAction) => {
  return appReducer(state, action);
};

export default rootReducer;
