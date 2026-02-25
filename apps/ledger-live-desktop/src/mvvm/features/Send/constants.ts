import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig, SendFlowConfig } from "./types";

export const SEND_FLOW_STEP_ORDER: readonly SendFlowStep[] = [
  SEND_FLOW_STEP.RECIPIENT,
  SEND_FLOW_STEP.AMOUNT,
  SEND_FLOW_STEP.CUSTOM_FEES,
  SEND_FLOW_STEP.COIN_CONTROL,
  SEND_FLOW_STEP.SIGNATURE,
  SEND_FLOW_STEP.CONFIRMATION,
];

export const SEND_STEP_CONFIGS: Record<SendFlowStep, SendStepConfig> = {
  [SEND_FLOW_STEP.RECIPIENT]: {
    id: SEND_FLOW_STEP.RECIPIENT,
    canGoBack: true,
    addressInput: true,
  },
  [SEND_FLOW_STEP.AMOUNT]: {
    id: SEND_FLOW_STEP.AMOUNT,
    canGoBack: true,
    addressInput: true,
    height: "hug",
  },
  [SEND_FLOW_STEP.CUSTOM_FEES]: {
    id: SEND_FLOW_STEP.CUSTOM_FEES,
    canGoBack: true,
    floating: true,
    titleKey: "newSendFlow.customFees.title",
    backTarget: SEND_FLOW_STEP.AMOUNT,
  },
  [SEND_FLOW_STEP.COIN_CONTROL]: {
    id: SEND_FLOW_STEP.COIN_CONTROL,
    canGoBack: true,
    floating: true,
    titleKey: "newSendFlow.coinControl.title",
    backTarget: SEND_FLOW_STEP.AMOUNT,
  },
  [SEND_FLOW_STEP.SIGNATURE]: {
    id: SEND_FLOW_STEP.SIGNATURE,
    canGoBack: false,
    showTitle: false,
    height: "hug",
  },
  [SEND_FLOW_STEP.CONFIRMATION]: {
    id: SEND_FLOW_STEP.CONFIRMATION,
    canGoBack: false,
    showTitle: false,
    height: "hug",
  },
};

export const SEND_FLOW_CONFIG: SendFlowConfig = {
  stepOrder: SEND_FLOW_STEP_ORDER,
  stepConfigs: SEND_STEP_CONFIGS,
};
