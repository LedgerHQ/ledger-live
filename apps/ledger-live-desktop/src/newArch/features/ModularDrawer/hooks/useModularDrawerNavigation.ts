import { useCallback, useState } from "react";
import {
  MODULAR_DRAWER_STEP,
  ModularDrawerStep,
  NAVIGATION_DIRECTION,
  NavigationDirection,
} from "../types";

const ACCOUNT_SELECTION_STEP_ORDER: ModularDrawerStep[] = [
  "ASSET_SELECTION",
  "NETWORK_SELECTION",
  "ACCOUNT_SELECTION",
];

interface UseGenericNavigationProps<T> {
  stepOrder: T[];
  initialStep: T;
  forwardDirection: NavigationDirection;
  backwardDirection: NavigationDirection;
}

export function useGenericNavigation<T>({
  stepOrder,
  initialStep,
  forwardDirection,
  backwardDirection,
}: UseGenericNavigationProps<T>) {
  const [currentStep, setCurrentStep] = useState<T>(initialStep);
  const [navigationDirection, setNavigationDirection] =
    useState<NavigationDirection>(forwardDirection);

  const goToStep = useCallback(
    (nextStep: T) => {
      const prevIdx = stepOrder.indexOf(currentStep);
      const nextIdx = stepOrder.indexOf(nextStep);
      if (nextIdx > prevIdx) {
        setNavigationDirection(forwardDirection);
      } else if (nextIdx < prevIdx) {
        setNavigationDirection(backwardDirection);
      }
      setCurrentStep(nextStep);
    },
    [currentStep, stepOrder, forwardDirection, backwardDirection],
  );

  return {
    currentStep,
    navigationDirection,
    goToStep,
    setCurrentStep,
  };
}

export function useModularDrawerNavigation(
  initialStep: ModularDrawerStep = MODULAR_DRAWER_STEP.ASSET_SELECTION,
) {
  return useGenericNavigation({
    stepOrder: ACCOUNT_SELECTION_STEP_ORDER,
    initialStep,
    forwardDirection: NAVIGATION_DIRECTION.FORWARD,
    backwardDirection: NAVIGATION_DIRECTION.BACKWARD,
  });
}
