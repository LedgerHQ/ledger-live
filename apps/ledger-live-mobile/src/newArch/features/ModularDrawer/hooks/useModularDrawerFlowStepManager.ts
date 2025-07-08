import { useState, useMemo } from "react";
import { ModularDrawerStep } from "../types";

const fullSteps: ModularDrawerStep[] = [
  ModularDrawerStep.Asset,
  ModularDrawerStep.Network,
  ModularDrawerStep.Account,
];

export interface UseModularDrawerFlowStepManagerProps {
  selectedStep: ModularDrawerStep;
}

export type StepFlowManagerReturnType = ReturnType<typeof useModularDrawerFlowStepManager>;

export function useModularDrawerFlowStepManager({
  selectedStep,
}: UseModularDrawerFlowStepManagerProps) {
  const steps = useMemo(() => {
    const startIndex = fullSteps.indexOf(selectedStep);
    return fullSteps.slice(startIndex);
  }, [selectedStep]);

  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];

  const nextStep = () => setStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStepIndex(prev => Math.max(prev - 1, 0));

  const reset = () => setStepIndex(0);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const hasBackButton = selectedStep !== currentStep;

  const handleBackButton = (
    goBackToAssetSelection: () => void,
    goBackToNetworkSelection: () => void,
  ): void => {
    switch (currentStep) {
      case ModularDrawerStep.Network:
        goBackToAssetSelection();
        break;
      case ModularDrawerStep.Account:
        goBackToNetworkSelection();
        break;
      case ModularDrawerStep.Asset:
      default:
        break;
    }
  };

  return {
    currentStep,
    currentStepIndex: stepIndex,
    nextStep,
    prevStep,
    reset,
    isFirstStep,
    isLastStep,
    hasBackButton,
    handleBackButton,
  };
}
