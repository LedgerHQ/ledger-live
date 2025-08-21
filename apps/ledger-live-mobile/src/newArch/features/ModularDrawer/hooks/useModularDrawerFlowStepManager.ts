import { useState } from "react";
import { ModularDrawerStep } from "../types";

const fullSteps: ModularDrawerStep[] = [
  ModularDrawerStep.Asset,
  ModularDrawerStep.Network,
  ModularDrawerStep.Account,
];

export type StepFlowManagerReturnType = ReturnType<typeof useModularDrawerFlowStepManager>;

export function useModularDrawerFlowStepManager() {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = fullSteps[stepIndex];

  const reset = () => setStepIndex(0);

  /**
   * Go directly to a specific step in the flow, if it exists in the current steps.
   * @param step ModularDrawerStep to go to
   */
  const goToStep = (step: ModularDrawerStep) => {
    const idx = fullSteps.indexOf(step);
    if (idx !== -1) {
      setStepIndex(idx);
    }
  };

  return {
    currentStep,
    currentStepIndex: stepIndex,
    reset,
    goToStep,
  };
}
