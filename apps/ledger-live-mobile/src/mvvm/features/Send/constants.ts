import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig, SendFlowConfig } from "./types";
import { ScreenName } from "~/const";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";

export const SEND_FLOW_STEP_ORDER: readonly SendFlowStep[] = [
  SEND_FLOW_STEP.RECIPIENT,
  SEND_FLOW_STEP.AMOUNT,
  SEND_FLOW_STEP.SIGNATURE,
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
  [SEND_FLOW_STEP.SIGNATURE]: {
    id: SEND_FLOW_STEP.SIGNATURE,
    canGoBack: false,
    showTitle: false,
    showHeaderRight: false,
    screenName: ScreenName.SendFlowSignature,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      title: "",
      gestureEnabled: false,
    },
  },
  [SEND_FLOW_STEP.CONFIRMATION]: {
    id: SEND_FLOW_STEP.CONFIRMATION,
    canGoBack: true,
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
