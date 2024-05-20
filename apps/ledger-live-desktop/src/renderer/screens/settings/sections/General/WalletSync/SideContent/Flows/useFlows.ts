import { useState } from "react";
import { Flow } from "~/renderer/reducers/walletSync";

export type HookProps = {
  flow: Flow;
};

export const FlowOptions: Record<
  Flow,
  {
    steps: number;
    hasGoBack: boolean;
  }
> = {
  [Flow.Activation]: {
    steps: 3,
    hasGoBack: false,
  },
  [Flow.Sync]: {
    steps: 2,
    hasGoBack: false,
  },
  [Flow.ManageBackup]: {
    steps: 2,
    hasGoBack: true,
  },
  [Flow.ManageInstances]: {
    steps: 2,
    hasGoBack: true,
  },
};

export const useFlows = ({ flow }: HookProps) => {
  const currentFlow = FlowOptions[flow];
  const [currentStep, setCurrentStep] = useState(1);
  const goToNextScene = () => {
    setCurrentStep(prev => (prev < currentFlow.steps ? prev + 1 : prev));
  };

  const goToPreviousScene = () => {
    setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));
  };

  return {
    currentStep,
    goToNextScene,
    goToPreviousScene,
    setCurrentStep,
  };
};
