import { useCallback } from "react";
import { Keyboard } from "react-native";
import { ModularDrawerStep } from "../types";
import { EVENTS_NAME } from "../analytics";
import {
  getCurrentPageName,
  useModularDrawerAnalytics,
} from "../analytics/useModularDrawerAnalytics";
import type { StepFlowManagerReturnType } from "./useModularDrawerFlowStepManager";

type UseDrawerLifecycleParams = {
  flow: string;
  navigationStepManager: StepFlowManagerReturnType;
  canGoBackToAsset: boolean;
  canGoBackToNetwork: boolean;
  backToAsset: () => void;
  backToNetwork: () => void;
  onClose?: () => void;
  resetSelection: () => void;
};

export function useDrawerLifecycle({
  flow,
  navigationStepManager,
  canGoBackToAsset,
  canGoBackToNetwork,
  backToAsset,
  backToNetwork,
  onClose,
  resetSelection,
}: UseDrawerLifecycleParams) {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const handleKeyboardDismiss = () => {
    if (Keyboard.isVisible()) Keyboard.dismiss();
  };

  const handleBackButton = useCallback(() => {
    const currentStep = navigationStepManager.currentStep;

    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "modularDrawer_backButton",
      flow,
      page: getCurrentPageName(navigationStepManager.currentStep),
    });

    switch (currentStep) {
      case ModularDrawerStep.Network:
        if (canGoBackToAsset) return backToAsset();
        return undefined;
      case ModularDrawerStep.Account:
        if (canGoBackToNetwork) return backToNetwork();
        if (canGoBackToAsset) return backToAsset();
        return undefined;
      default:
        return undefined;
    }
  }, [
    navigationStepManager.currentStep,
    trackModularDrawerEvent,
    flow,
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
  ]);

  const handleCloseButton = useCallback(() => {
    resetSelection();
    navigationStepManager.reset();
    handleKeyboardDismiss();
    onClose?.();
    const page =
      navigationStepManager.currentStep === ModularDrawerStep.Network
        ? "Add Account Select Network"
        : getCurrentPageName(navigationStepManager.currentStep);

    const flowName =
      navigationStepManager.currentStep === ModularDrawerStep.Network ? "Add Account" : flow;

    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "Close",
      flow: flowName,
      page,
    });
  }, [trackModularDrawerEvent, flow, navigationStepManager, onClose, resetSelection]);

  return { handleBackButton, handleCloseButton } as const;
}
