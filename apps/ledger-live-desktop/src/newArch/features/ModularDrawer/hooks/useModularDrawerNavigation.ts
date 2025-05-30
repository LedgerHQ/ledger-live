import { useCallback, useRef, useState } from "react";
import { ModularDrawerStep, NavigationDirection } from "../types";

export function useModularDrawerNavigation(initialStep: ModularDrawerStep = "ASSET_SELECTION") {
  const [currentStep, setCurrentStep] = useState<ModularDrawerStep>(initialStep);
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>("FORWARD");
  const prevStepRef = useRef<ModularDrawerStep>(initialStep);

  const goToStep = useCallback(
    (nextStep: ModularDrawerStep) => {
      const stepOrder: ModularDrawerStep[] = [
        "ASSET_SELECTION",
        "NETWORK_SELECTION",
        "ACCOUNT_SELECTION",
      ];
      const prevIdx = stepOrder.indexOf(currentStep);
      const nextIdx = stepOrder.indexOf(nextStep);
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
