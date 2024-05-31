import { useState } from "react";
import { useDispatch } from "react-redux";
import { setStep } from "~/renderer/actions/walletSync";
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
  [Flow.Synchronize]: {
    steps: 2,
    hasGoBack: false,
  },
  [Flow.ManageBackups]: {
    steps: 3,
    hasGoBack: true,
  },
  [Flow.ManageInstances]: {
    steps: 2,
    hasGoBack: true,
  },
};

export const useFlows = ({ flow }: HookProps) => {
  const currentFlow = FlowOptions[flow];

  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const goToNextScene = () => {
    dispatch(setStep(currentStep < currentFlow.steps ? currentStep + 1 : currentStep));
    setCurrentStep(prev => (prev < currentFlow.steps ? prev + 1 : prev));
  };

  const goToPreviousScene = () => {
    dispatch(setStep(currentStep > 1 ? currentStep - 1 : currentStep));
    setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));
  };

  return {
    currentStep,
    goToNextScene,
    goToPreviousScene,
    setCurrentStep,
  };
};
