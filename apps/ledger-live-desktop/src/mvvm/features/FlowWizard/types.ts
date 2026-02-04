import type {
  FlowStep,
  FlowStepConfig,
  FlowConfig,
  StepRenderer,
} from "@ledgerhq/live-common/flows/wizard/types";

/**
 * LLD-specific types for FlowWizard navigation
 *
 * These types are specific to LLD's custom navigation system
 * (not used by LLM which uses React Navigation Stack)
 */

export const FLOW_NAVIGATION_DIRECTION = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
} as const;

export type FlowNavigationDirection =
  (typeof FLOW_NAVIGATION_DIRECTION)[keyof typeof FLOW_NAVIGATION_DIRECTION];

export type FlowNavigationState<TStep extends FlowStep = FlowStep> = Readonly<{
  currentStep: TStep;
  direction: FlowNavigationDirection;
  stepHistory: TStep[];
}>;

export type FlowNavigationActions<TStep extends FlowStep = FlowStep> = Readonly<{
  goToStep: (step: TStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}>;

export type FlowWizardContextValue<
  TStep extends FlowStep = FlowStep,
  TContextValue = unknown,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = TContextValue &
  Readonly<{
    navigation: FlowNavigationActions<TStep>;
    currentStep: TStep;
    direction: FlowNavigationDirection;
    currentStepConfig: TStepConfig;
    currentStepRenderer: StepRenderer | null;
    stepHistory: readonly TStep[];
  }>;

export type UseFlowWizardNavigationParams<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  flowConfig: FlowConfig<TStep, TStepConfig>;
}>;

export type UseFlowWizardNavigationResult<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  state: FlowNavigationState<TStep>;
  actions: FlowNavigationActions<TStep>;
  currentStepConfig: TStepConfig;
  isFirstStep: boolean;
  isLastStep: boolean;
}>;
