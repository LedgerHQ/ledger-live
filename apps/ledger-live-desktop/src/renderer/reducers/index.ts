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
import marketBanner, { MarketBannerState } from "./marketBanner";
import wallet from "./wallet";
import type { WalletState } from "./wallet";
import { authEnvironmentReducer, type AuthEnvironmentState } from "@shared/auth";
import walletSync, { WalletSyncState } from "./walletSync";
import trustchain from "./trustchain";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getEnv } from "@shared/env";
import countervalues, { CountervaluesState } from "./countervalues";
import modularDialog, { ModularDialogState } from "./modularDialog";
import sendFlow, { SendFlowState } from "./sendFlow";
import onboarding, { OnboardingState } from "./onboarding";
import { lldRTKApiReducers, LLDRTKApiState } from "./rtkQueryApi";
import { accountAliasSlice, type AccountAliasState } from "@domain/entity-account-alias";
import { identitiesSlice, type IdentitiesState } from "@domain/entity-client-identity";
import { supportedFiatsSlice, type SupportedFiatsState } from "@domain/entity-currency-fiat";
import { contactsSlice, type ContactsState } from "@domain/entity-contact";
import {
  largeScreenUpsellModalSlice,
  type LargeScreenUpsellModalState,
} from "@features/flow-large-screen-upsell";
import { payCardBalanceSlice, type PayCardBalanceState } from "@features/flow-pay-balance/state";
import {
  payCardFeatureTourSlice,
  type PayCardFeatureTourState,
} from "@features/flow-pay-feature-tour/state";
import {
  payRequestVerifyHintSlice,
  type PayRequestVerifyHintState,
} from "@features/flow-pay-request/state";
import {
  payCardOnboardingWidgetSlice,
  type PayCardOnboardingWidgetState,
} from "@features/flow-pay-card-widget/state";
import { payCardAuthSlice, type PayCardAuthState } from "@features/flow-pay-card-auth/state";
import type { PayloadAction, UnknownAction } from "@reduxjs/toolkit";
import dialogs, { DialogsState } from "./dialogs";
import dialogsWithData, { DialogsWithDataState } from "./dialogsWithData";
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
import coinConfigOverrides, { CoinConfigOverridesState } from "./coinConfigOverrides";
import knownDevices, { KnownDevicesState } from "./knownDevices";

export type State = LLDRTKApiState & {
  accountAliases: AccountAliasState;
  accounts: AccountsState;
  application: ApplicationState;
  countervalues: CountervaluesState;
  devices: DevicesState;
  dynamicContent: DynamicContentState;
  featureFlags: FeatureFlagsState;
  history: HistoryState;
  identities: IdentitiesState;
  authEnvironment: AuthEnvironmentState;
  market: MarketState;
  marketBanner: MarketBannerState;
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
  dialogsWithData: DialogsWithDataState;
  ptxInfoDialog: PtxInfoDialogState;
  actionDialog: ActionDialogState;
  liveAppModal: LiveAppModalState;
  syncRefresh: SyncRefreshState;
  shieldedSyncSubscriptions: ShieldedSyncSubscriptionsState;
  countervaluesExtraTracking: CountervaluesExtraTrackingState;
  recoverState: RecoverStateSliceState;
  genericAwarenessModal: GenericAwarenessModalSliceState;
  coinConfigOverrides: CoinConfigOverridesState;
  knownDevices: KnownDevicesState;
  supportedFiats: SupportedFiatsState;
  contacts: ContactsState;
  largeScreenUpsellModal: LargeScreenUpsellModalState;
  payCardBalance: PayCardBalanceState;
  payCardFeatureTour: PayCardFeatureTourState;
  payRequestVerifyHint: PayRequestVerifyHintState;
  payCardOnboardingWidget: PayCardOnboardingWidgetState;
  payCardAuth: PayCardAuthState;
};

const appReducer = combineReducers({
  accountAliases: accountAliasSlice.reducer,
  accounts,
  application,
  countervalues,
  devices,
  dynamicContent,
  featureFlags,
  history,
  identities: identitiesSlice.reducer,
  authEnvironment: authEnvironmentReducer,
  modals,
  modularDialog,
  sendFlow,
  settings,
  UI,
  onboarding,
  postOnboarding,
  market,
  marketBanner,
  wallet,
  walletSync,
  trustchain,
  dialogs,
  dialogsWithData,
  ptxInfoDialog,
  actionDialog,
  liveAppModal,
  syncRefresh,
  shieldedSyncSubscriptions,
  countervaluesExtraTracking,
  recoverState: recoverStateReducer,
  genericAwarenessModal,
  coinConfigOverrides,
  knownDevices,
  supportedFiats: supportedFiatsSlice.reducer,
  contacts: contactsSlice.reducer,
  largeScreenUpsellModal: largeScreenUpsellModalSlice.reducer,
  payCardBalance: payCardBalanceSlice.reducer,
  payCardFeatureTour: payCardFeatureTourSlice.reducer,
  payRequestVerifyHint: payRequestVerifyHintSlice.reducer,
  payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer,
  payCardAuth: payCardAuthSlice.reducer,
  ...lldRTKApiReducers,
  ...(getEnv("PLAYWRIGHT_RUN") && {
    lastAction: (_: unknown, action: PayloadAction) => action,
  }),
});

const rootReducer = (state: State | undefined, action: UnknownAction) => {
  return appReducer(state, action);
};

export default rootReducer;
