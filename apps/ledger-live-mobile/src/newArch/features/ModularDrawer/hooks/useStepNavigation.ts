import { useCallback } from "react";
import { ModularDrawerStep } from "../types";
import type { StepFlowManagerReturnType } from "./useModularDrawerFlowStepManager";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type UseStepNavigationParams = {
  navigationStepManager: StepFlowManagerReturnType;
  availableNetworksCount: number;
  hasOneCurrency: boolean;
  resetSelection: () => void;
  clearNetwork: () => void;
  selectNetwork?: (n: CryptoOrTokenCurrency) => void;
  navigateToDeviceWithCurrency: (selectedCurrency: CryptoOrTokenCurrency) => void;
  enableAccountSelection?: boolean;
};

export function useStepNavigation({
  navigationStepManager,
  availableNetworksCount,
  hasOneCurrency,
  resetSelection,
  clearNetwork,
  selectNetwork,
  enableAccountSelection,
  navigateToDeviceWithCurrency,
}: UseStepNavigationParams) {
  const canGoBackToAsset = !hasOneCurrency;
  const canGoBackToNetwork = availableNetworksCount > 1;

  const backToAsset = useCallback(() => {
    resetSelection();
    navigationStepManager.goToStep(ModularDrawerStep.Asset);
  }, [navigationStepManager, resetSelection]);

  const backToNetwork = useCallback(() => {
    clearNetwork();
    navigationStepManager.goToStep(ModularDrawerStep.Network);
  }, [navigationStepManager, clearNetwork]);

  const currentStep = navigationStepManager.currentStep;
  const shouldShowBackButton = (() => {
    switch (currentStep) {
      case ModularDrawerStep.Network:
        return canGoBackToAsset;
      case ModularDrawerStep.Account:
        return canGoBackToNetwork || canGoBackToAsset;
      default:
        return false;
    }
  })();

  const proceedToNextStep = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      if (selectNetwork) selectNetwork(selectedNetwork);
      if (enableAccountSelection) {
        navigationStepManager.goToStep(ModularDrawerStep.Account);
      } else {
        navigateToDeviceWithCurrency(selectedAsset);
      }
    },
    [navigationStepManager, selectNetwork, enableAccountSelection, navigateToDeviceWithCurrency],
  );

  return {
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
    shouldShowBackButton,
    proceedToNextStep,
  } as const;
}
