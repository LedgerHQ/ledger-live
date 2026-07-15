import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig, SendFlowConfig } from "./types";
import { ScreenName } from "~/const";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";

// SIGNATURE is intentionally absent: it is not a navigation screen. The signature step (DIE &
// bottom sheet) is rendered as a co-located overlay from the focused screen
// to avoid stacking a native modal over the Gorhom bottom sheet portal
export const SEND_FLOW_STEP_ORDER: readonly SendFlowStep[] = [
  SEND_FLOW_STEP.RECIPIENT,
  SEND_FLOW_STEP.AMOUNT,
  SEND_FLOW_STEP.CUSTOM_FEES,
  SEND_FLOW_STEP.COIN_CONTROL,
  SEND_FLOW_STEP.CONFIRMATION,
];

export const SEND_STEP_CONFIGS: Record<SendFlowStep, SendStepConfig> = {
  [SEND_FLOW_STEP.RECIPIENT]: {
    id: SEND_FLOW_STEP.RECIPIENT,
    canGoBack: true,
    addressInput: true,
    screenName: ScreenName.SendFlowRecipient,
    showHeaderRight: false,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
    },
  },
  [SEND_FLOW_STEP.RECENT_HISTORY]: {
    id: SEND_FLOW_STEP.RECENT_HISTORY,
    canGoBack: true,
    showHeaderRight: false,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
    },
  },
  [SEND_FLOW_STEP.AMOUNT]: {
    id: SEND_FLOW_STEP.AMOUNT,
    canGoBack: true,
    addressInput: true,
    screenName: ScreenName.SendFlowAmount,
    showHeaderRight: false,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
    },
  },
  [SEND_FLOW_STEP.CUSTOM_FEES]: {
    id: SEND_FLOW_STEP.CUSTOM_FEES,
    canGoBack: true,
    floating: true,
    screenName: ScreenName.SendFlowCustomFees,
    showHeaderRight: false,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
    },
  },
  [SEND_FLOW_STEP.COIN_CONTROL]: {
    id: SEND_FLOW_STEP.COIN_CONTROL,
    canGoBack: true,
    floating: true,
    screenName: ScreenName.SendFlowCoinControl,
    showHeaderRight: false,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
    },
  },
  // Not registered as a navigation screen (absent from SEND_FLOW_STEP_ORDER). Kept only to satisfy
  // the Record<SendFlowStep, SendStepConfig> contract. The signature step is rendered as an overlay
  // by the focused screen via the SignatureOverlayHost.
  [SEND_FLOW_STEP.SIGNATURE]: {
    id: SEND_FLOW_STEP.SIGNATURE,
    canGoBack: false,
    showTitle: false,
    showHeaderRight: false,
  },
  [SEND_FLOW_STEP.CONFIRMATION]: {
    id: SEND_FLOW_STEP.CONFIRMATION,
    canGoBack: false,
    showHeaderRight: false,
    showTitle: false,
    screenName: ScreenName.SendFlowConfirmation,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
    },
  },
};

export const SEND_FLOW_CONFIG: SendFlowConfig = {
  stepOrder: SEND_FLOW_STEP_ORDER,
  stepConfigs: SEND_STEP_CONFIGS,
};
