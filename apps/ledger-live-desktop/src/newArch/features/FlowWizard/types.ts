import type { ComponentType } from "react";

export type FlowStep = string;

export const FLOW_NAVIGATION_DIRECTION = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
};

export type FlowNavigationDirection =
  (typeof FLOW_NAVIGATION_DIRECTION)[keyof typeof FLOW_NAVIGATION_DIRECTION];

export const FLOW_STATUS = {
  IDLE: "IDLE",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
};

export type FlowStatus = (typeof FLOW_STATUS)[keyof typeof FLOW_STATUS];

export type FlowStepConfig<TStep extends FlowStep = FlowStep> = Readonly<{
  id: TStep;
  canGoBack: boolean;
  showHeader?: boolean;
}>;

export type AnimationConfig = Readonly<{
  forward?: string;
  backward?: string;
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

export type FlowConfig<TStep extends FlowStep = FlowStep> = Readonly<{
  stepOrder: readonly TStep[];
  stepConfigs: Record<TStep, FlowStepConfig<TStep>>;
  initialStep?: TStep;
  initialHistory?: TStep[];
}>;

export type FlowWizardAugmentation<TStep extends FlowStep = FlowStep> = Readonly<{
  navigation: FlowNavigationActions<TStep>;
  currentStep: TStep;
  direction: FlowNavigationDirection;
  currentStepConfig: FlowStepConfig<TStep>;
}>;

export type FlowWizardContextValue<TStep extends FlowStep, TContextBase> = Readonly<
  TContextBase & FlowWizardAugmentation<TStep>
>;

export type UseFlowWizardNavigationParams<TStep extends FlowStep = FlowStep> = Readonly<{
  flowConfig: FlowConfig<TStep>;
}>;

export type UseFlowWizardNavigationResult<TStep extends FlowStep = FlowStep> = Readonly<{
  state: FlowNavigationState<TStep>;
  actions: FlowNavigationActions<TStep>;
  currentStepConfig: FlowStepConfig<TStep>;
  isFirstStep: boolean;
  isLastStep: boolean;
}>;
