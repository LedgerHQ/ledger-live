import type { ComponentType } from "react";

export type FlowStep = string;

export const FLOW_NAVIGATION_DIRECTION = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
} as const;

export type FlowNavigationDirection =
  (typeof FLOW_NAVIGATION_DIRECTION)[keyof typeof FLOW_NAVIGATION_DIRECTION];

export const FLOW_STATUS = {
  IDLE: "IDLE",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
} as const;

export type FlowStatus = (typeof FLOW_STATUS)[keyof typeof FLOW_STATUS];

export type FlowStepConfig<TStep extends FlowStep = FlowStep> = Readonly<{
  id: TStep;
  canGoBack: boolean;
  showHeader?: boolean;
}>;

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

export type FlowStatusActions = Readonly<{
  setStatus: (status: FlowStatus) => void;
  setError: () => void;
  setSuccess: () => void;
  resetStatus: () => void;
}>;

export type StepRenderer = ComponentType<unknown>;

export type StepRegistry<TStep extends FlowStep = FlowStep> = Partial<Record<TStep, StepRenderer>>;

export type FlowConfig<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  stepOrder: readonly TStep[];
  stepConfigs: Record<TStep, TStepConfig>;
  initialStep?: TStep;
  initialHistory?: TStep[];
}>;

/**
 * The shape of the FlowWizard's internal navigation context.
 *
 * Flows access this via useFlowWizard() hook.
 */
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
