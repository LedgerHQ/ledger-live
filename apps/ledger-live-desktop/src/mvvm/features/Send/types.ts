import type { FlowStepConfig, FlowConfig } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep, SendFlowBusinessContext } from "@ledgerhq/live-common/flows/send/types";
import type { FlowNavigationDirection, FlowNavigationActions } from "../FlowWizard/types";

export type SendStepConfig = FlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "hug";
    /**
     * A step that is not in an original order of previous <-> next paradigm
     */
    floating?: boolean;
    /** i18n key used as the header title, overrides the default flow title. */
    titleKey?: string;
    /** Explicit step to navigate to when the user presses Back. */
    backTarget?: SendFlowStep;
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
