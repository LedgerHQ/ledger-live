import postOnboarding from "@ledgerhq/live-common/postOnboarding/reducer";
import { largeScreenUpsellModalReducer } from "@ledgerhq/live-engagement/largeScreenUpsellModal";
import postOnboardingHubDrawer from "./postOnboardingHubDrawer";
import { combineReducers, type Store } from "redux";
import { llmRTKApiReducers } from "~/context/rtkQueryApi";
import featureFlags from "@shared/feature-flags";
import accounts from "./accounts";
import appstate from "./appstate";
import auth from "./auth";
import ble from "./ble";
import borrow from "./borrow";
import countervalues from "./countervalues";
import deeplinkInstallApp from "./deeplinkInstallApp";
import dynamicContent from "./dynamicContent";
import earn from "./earn";
import genericAwarenessModal from "./genericAwarenessModal";
import backupHubFeatureIntro from "./backupHubFeatureIntro";
import productTourDrawer from "./productTourDrawer";
import history from "./history";
import inView from "./inView";
import knownDevices from "./knownDevices";
import largeMover from "./largeMover";
import market, { marketListConfigReducer } from "./market";
import { marketBannerReducer } from "./marketBanner";
import modularDrawer from "./modularDrawer";
import receiveOptionsDrawer from "./receiveOptionsDrawer";
import rebornBuyDeviceDrawer from "./rebornBuyDeviceDrawer";
import transferDrawer from "./transferDrawer";
import swapTransactionStatusDrawer from "./swapTransactionStatusDrawer";
import notifications from "./notifications";
import protect from "./protect";
import ratings from "./ratings";
import settings from "./settings";
import sendFlow from "./sendFlow";
import toasts from "./toast";
import trustchain from "./trustchain";
import type { State } from "./types";
import wallet from "./wallet";
import walletconnect from "./walletconnect";
import walletSync from "./walletSync";
import portfolioRefresh from "./portfolioRefresh";
import portfolioBalanceDisplay from "./portfolioBalanceDisplay";
import recoverState from "./recoverState";
import liveAppModal from "./liveAppModal";
import { authEnvironmentReducer } from "@shared/auth";
import { identitiesSlice } from "@domain/entity-client-identity";
import { supportedFiatsSlice } from "@domain/entity-currency-fiat";
import { payCardBalanceSlice } from "@features/flow-pay-balance/state";
import { payCardFeatureTourSlice } from "@features/flow-pay-feature-tour/state";
import { payRequestVerifyHintSlice } from "@features/flow-pay-request/state";
import { payCardAuthSlice } from "@features/flow-pay-card-auth/state";
import { contactsSlice } from "@domain/entity-contact";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import type { UnknownAction } from "@reduxjs/toolkit";

export type AppStore = Store<State>;

const appReducer = combineReducers({
  accounts,
  accountBalances: accountBalancesSlice.reducer,
  accountOperations: accountOperationsSlice.reducer,
  appstate,
  auth,
  ble,
  borrow,
  countervalues,
  deeplinkInstallApp,
  dynamicContent,
  earn,
  featureFlags,
  genericAwarenessModal,
  backupHubFeatureIntro,
  productTourDrawer,
  history,
  identities: identitiesSlice.reducer,
  inView,
  knownDevices,
  authEnvironment: authEnvironmentReducer,
  largeMover,
  market,
  marketListConfig: marketListConfigReducer,
  marketBanner: marketBannerReducer,
  modularDrawer,
  receiveOptionsDrawer,
  rebornBuyDeviceDrawer,
  transferDrawer,
  swapTransactionStatusDrawer,
  notifications,
  largeScreenUpsellModal: largeScreenUpsellModalReducer,
  postOnboarding,
  postOnboardingHubDrawer,
  protect,
  ratings,
  settings,
  sendFlow,
  payCardBalance: payCardBalanceSlice.reducer,
  payCardFeatureTour: payCardFeatureTourSlice.reducer,
  payRequestVerifyHint: payRequestVerifyHintSlice.reducer,
  payCardAuth: payCardAuthSlice.reducer,
  toasts,
  trustchain,
  wallet,
  walletconnect,
  walletSync,
  portfolioRefresh,
  portfolioBalanceDisplay,
  recoverState,
  liveAppModal,
  supportedFiats: supportedFiatsSlice.reducer,
  contacts: contactsSlice.reducer,
  ...llmRTKApiReducers,
});

// TODO: EXPORT ALL POSSIBLE ACTION TYPES AND USE ACTION<TYPES>
const rootReducer = (state: State | undefined, action: UnknownAction) => {
  return appReducer(state, action);
};

export default rootReducer;
