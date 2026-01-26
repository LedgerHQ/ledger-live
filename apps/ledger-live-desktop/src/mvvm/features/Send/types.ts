import type { FlowStepConfig, FlowConfig } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep, SendFlowBusinessContext } from "@ledgerhq/live-common/flows/send/types";
import type { FlowNavigationDirection, FlowNavigationActions } from "../FlowWizard/types";

export type SendStepConfig = FlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "hug";
  }>;

export type SendFlowConfig = FlowConfig<SendFlowStep, SendStepConfig>;

export type NavigationDirection = FlowNavigationDirection;

export type SendFlowNavigationActions = FlowNavigationActions<SendFlowStep>;

export type SendFlowContextValue = SendFlowBusinessContext &
  Readonly<{
    navigation: SendFlowNavigationActions;
    currentStep: SendFlowStep;
    direction: NavigationDirection;
    currentStepConfig: SendStepConfig;
  }>;
