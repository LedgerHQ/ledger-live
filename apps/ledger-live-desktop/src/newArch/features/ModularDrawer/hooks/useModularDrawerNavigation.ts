import { useCallback, useRef, useState } from "react";
import {
  MODULAR_DRAWER_ADD_ACCOUNT_STEP,
  MODULAR_DRAWER_STEP,
  ModularDrawerAddAccountStep,
  ModularDrawerStep,
  NAVIGATION_DIRECTION,
  NavigationDirection,
} from "../types";

const ACCOUNT_SELECTION_STEP_ORDER: ModularDrawerStep[] = [
  "ASSET_SELECTION",
  "NETWORK_SELECTION",
  "ACCOUNT_SELECTION",
];

const ADD_ACCOUNT_STEP_ORDER: ModularDrawerAddAccountStep[] = [
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS,
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED,
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING,
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT,
  MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT,
];

interface UseGenericNavigationProps<T> {
  stepOrder: T[];
  initialStep: T;
  forwardDirection: NavigationDirection;
  backwardDirection: NavigationDirection;
}

function useGenericNavigation<T>({
  stepOrder,
  initialStep,
  forwardDirection,
  backwardDirection,
}: UseGenericNavigationProps<T>) {
  const [currentStep, setCurrentStep] = useState<T>(initialStep);
  const [navigationDirection, setNavigationDirection] =
    useState<NavigationDirection>(forwardDirection);
  const prevStepRef = useRef<T>(initialStep);

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
      prevStepRef.current = nextStep;
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

export function useAddAccountNavigation() {
  return useGenericNavigation({
    backwardDirection: NAVIGATION_DIRECTION.BACKWARD,
    forwardDirection: NAVIGATION_DIRECTION.FORWARD,
    initialStep: MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
    stepOrder: ADD_ACCOUNT_STEP_ORDER,
  });
}
