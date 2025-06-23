import { useCallback, useRef, useState } from "react";
import { ModularDrawerStep, NavigationDirection } from "../types";

const ACCOUNT_SELECTION_STEP_ORDER: ModularDrawerStep[] = [
  "ASSET_SELECTION",
  "NETWORK_SELECTION",
  "ACCOUNT_SELECTION",
];

export function useModularDrawerNavigation(initialStep: ModularDrawerStep = "ASSET_SELECTION") {
  const [currentStep, setCurrentStep] = useState<ModularDrawerStep>(initialStep);
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>("FORWARD");
  const prevStepRef = useRef<ModularDrawerStep>(initialStep);

  const goToStep = useCallback(
    (nextStep: ModularDrawerStep) => {
      const prevIdx = ACCOUNT_SELECTION_STEP_ORDER.indexOf(currentStep);
      const nextIdx = ACCOUNT_SELECTION_STEP_ORDER.indexOf(nextStep);
      if (nextIdx > prevIdx) {
        setNavigationDirection("FORWARD");
      } else if (nextIdx < prevIdx) {
        setNavigationDirection("BACKWARD");
      }
      setCurrentStep(nextStep);
      prevStepRef.current = nextStep;
    },
    [currentStep],
  );

  return {
    currentStep,
    navigationDirection,
    goToStep,
    setCurrentStep,
  };
}
