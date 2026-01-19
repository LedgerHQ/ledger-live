import { useCallback } from "react";
import { Keyboard } from "react-native";
import { ModularDrawerStep } from "../types";
import { EVENTS_NAME } from "../analytics";
import {
  getCurrentPageName,
  useModularDrawerAnalytics,
} from "../analytics/useModularDrawerAnalytics";

import { useSelector, useDispatch } from "~/context/hooks";
import {
  modularDrawerFlowSelector,
  modularDrawerStepSelector,
  setStep,
} from "~/reducers/modularDrawer";

type UseDrawerLifecycleParams = {
  canGoBackToAsset: boolean;
  canGoBackToNetwork: boolean;
  backToAsset: () => void;
  backToNetwork: () => void;
  onClose?: () => void;
  resetSelection: () => void;
};

export function useDrawerLifecycle({
  canGoBackToAsset,
  canGoBackToNetwork,
  backToAsset,
  backToNetwork,
  onClose,
  resetSelection,
}: UseDrawerLifecycleParams) {
  const dispatch = useDispatch();
  const flow = useSelector(modularDrawerFlowSelector);
  const currentStep = useSelector(modularDrawerStepSelector);
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const handleKeyboardDismiss = () => {
    if (Keyboard.isVisible()) Keyboard.dismiss();
  };

  const handleBackButton = useCallback(() => {
    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "modularDrawer_backButton",
      flow,
      page: getCurrentPageName(currentStep),
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
    currentStep,
    trackModularDrawerEvent,
    flow,
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
  ]);

  const handleCloseButton = useCallback(() => {
    resetSelection();
    dispatch(setStep(ModularDrawerStep.Asset));
    handleKeyboardDismiss();
    onClose?.();
    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "Close",
      flow,
      page: getCurrentPageName(currentStep),
    });
  }, [trackModularDrawerEvent, flow, currentStep, onClose, resetSelection, dispatch]);

  return { handleBackButton, handleCloseButton } as const;
}
