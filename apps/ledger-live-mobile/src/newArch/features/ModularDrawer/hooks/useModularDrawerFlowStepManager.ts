import { useState, useMemo } from "react";
import { ModularDrawerStep } from "../types";

const steps: ModularDrawerStep[] = [
  ModularDrawerStep.Asset,
  ModularDrawerStep.Network,
  ModularDrawerStep.Account,
];

export interface UseModularDrawerFlowStepManagerProps {
  selectedStep?: ModularDrawerStep;
}

export function useModularDrawerFlowStepManager({
  selectedStep,
}: UseModularDrawerFlowStepManagerProps = {}) {
  const initialIndex =
    selectedStep && steps.includes(selectedStep) ? steps.indexOf(selectedStep) : 0;

  const [stepIndex, setStepIndex] = useState<number>(initialIndex);
  const currentStep = steps[stepIndex];

  const nextStep = () => setStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStepIndex(prev => Math.max(prev - 1, 0));
  const reset = () => setStepIndex(0);

  const isFirstStep = useMemo(() => stepIndex === 0, [stepIndex]);
  const isLastStep = useMemo(() => stepIndex === steps.length - 1, [stepIndex]);

  return {
    currentStep,
    currentStepIndex: stepIndex,
    nextStep,
    prevStep,
    reset,
    isFirstStep,
    isLastStep,
  };
}
