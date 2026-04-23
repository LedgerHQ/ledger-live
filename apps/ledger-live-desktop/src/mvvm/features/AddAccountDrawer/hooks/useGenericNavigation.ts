import { useCallback, useState } from "react";
import { NavigationDirection } from "../components/AnimatedScreenWrapper";

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
