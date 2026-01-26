import type { FlowStepConfig, FlowConfig } from "@ledgerhq/live-common/flows/wizard/types";
import type {
  SendFlowStep,
  SendFlowBusinessContext,
  NavigationDirection,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendFlowNavigationActions } from "@ledgerhq/live-common/flows/send/types";

export type SendStepConfig = FlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "hug";
  }>;

export type SendFlowConfig = FlowConfig<SendFlowStep, SendStepConfig>;

export type SendFlowContextValue = SendFlowBusinessContext &
  Readonly<{
    navigation: SendFlowNavigationActions;
    currentStep: SendFlowStep;
    direction: NavigationDirection;
    currentStepConfig: SendStepConfig;
  }>;
