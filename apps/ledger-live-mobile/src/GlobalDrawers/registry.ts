import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import { PostOnboardingHubDrawerWrapper } from "LLM/features/PostOnboardingHubDrawer";
import ReceiveDrawerWrapper from "LLM/features/Receive/drawers/ReceiveFundsOptionsDrawer";
import RebornBuyDeviceDrawer from "LLM/features/Reborn/drawers/RebornBuyDeviceDrawer";
import { DeeplinkInstallAppDrawer } from "LLM/features/DeeplinkInstallApp";
import { NotificationsPromptWrapper } from "LLM/features/NotificationsPrompt";
import { SwapTransactionStatusDrawerWrapper } from "LLM/features/SwapTransactionStatus";
import { RegionRestrictedDrawer } from "LLM/features/Accounts/components/RegionRestrictedDrawer";
import { AppProtectionPromptWrapper } from "LLM/features/AppLock/AppProtectionPrompt";
import {
  PredictionsOrderSheet,
  PredictionsSetupSheet,
  PredictionsSheet,
} from "@features/flow-predictions";
import PredictionsSigningRoot from "LLM/features/Predictions/signingIntent/PredictionsSigningRoot";

/**
 * Registry of all global drawers in the application.
 * The drawer will automatically be rendered in GlobalDrawers.
 */

export interface DrawerRegistryEntry {
  component: React.ComponentType;
}

export const DRAWER_REGISTRY = {
  modularAssets: {
    component: ModularDrawerWrapper,
  },
  postOnboardingHub: {
    component: PostOnboardingHubDrawerWrapper,
  },
  receive: {
    component: ReceiveDrawerWrapper,
  },
  reborn: {
    component: RebornBuyDeviceDrawer,
  },
  deeplinkInstallApp: {
    component: DeeplinkInstallAppDrawer,
  },
  notificationsPrompt: {
    component: NotificationsPromptWrapper,
  },
  swapTransactionStatus: {
    component: SwapTransactionStatusDrawerWrapper,
  },
  currencyRegionRestricted: {
    component: RegionRestrictedDrawer,
  },
  appProtectionPrompt: {
    component: AppProtectionPromptWrapper,
  },
  predictions: {
    component: PredictionsSheet,
  },
  predictionsSigning: {
    component: PredictionsSigningRoot,
  },
  predictionsSetup: {
    component: PredictionsSetupSheet,
  },
  predictionsOrder: {
    component: PredictionsOrderSheet,
  },
} as const satisfies Record<string, DrawerRegistryEntry>;

/**
 * Array of all drawer entries for iteration.
 */
export const DRAWER_ENTRIES = Object.entries(DRAWER_REGISTRY).map(([key, entry]) => ({
  key,
  ...entry,
}));
