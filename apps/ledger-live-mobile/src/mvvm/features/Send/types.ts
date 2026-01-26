import type { ReactNativeFlowStepConfig, ReactNativeFlowConfig } from "../FlowWizard/types.native";
import type {
  SendFlowStep,
  SendFlowBusinessContext,
  NavigationDirection,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendFlowNavigationActions } from "@ledgerhq/live-common/flows/send/types";

export type SendStepConfig = ReactNativeFlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "hug";
  }>;

export type SendFlowConfig = ReactNativeFlowConfig<SendFlowStep, SendStepConfig>;

export type SendFlowContextValue = SendFlowBusinessContext &
  Readonly<{
    navigation: SendFlowNavigationActions;
    currentStep: SendFlowStep;
    direction: NavigationDirection;
    currentStepConfig: SendStepConfig;
  }>;
