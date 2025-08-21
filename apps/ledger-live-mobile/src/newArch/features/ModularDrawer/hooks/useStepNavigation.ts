import { useCallback, useMemo } from "react";
import { ModularDrawerStep } from "../types";
import type { StepFlowManagerReturnType } from "./useModularDrawerFlowStepManager";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type UseStepNavigationParams = {
  navigationStepManager: StepFlowManagerReturnType;
  availableNetworksCount: number;
  hasOneCurrency: boolean;
  resetSelection: () => void;
  clearNetwork: () => void;
  selectNetwork?: (a: CryptoOrTokenCurrency, n: CryptoOrTokenCurrency) => void;
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
  const canGoBackToAsset = useMemo(() => !hasOneCurrency, [hasOneCurrency]);
  const canGoBackToNetwork = useMemo(() => availableNetworksCount > 1, [availableNetworksCount]);

  const backToAsset = useCallback(() => {
    resetSelection();
    navigationStepManager.goToStep(ModularDrawerStep.Asset);
  }, [navigationStepManager, resetSelection]);

  const backToNetwork = useCallback(() => {
    clearNetwork();
    navigationStepManager.goToStep(ModularDrawerStep.Network);
  }, [navigationStepManager, clearNetwork]);

  const shouldShowBackButton = useMemo(() => {
    const currentStep = navigationStepManager.currentStep;
    switch (currentStep) {
      case ModularDrawerStep.Network:
        return canGoBackToAsset;
      case ModularDrawerStep.Account:
        return canGoBackToNetwork || canGoBackToAsset;
      default:
        return false;
    }
  }, [navigationStepManager.currentStep, canGoBackToAsset, canGoBackToNetwork]);

  const proceedToNextStep = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      if (selectNetwork) selectNetwork(selectedAsset, selectedNetwork);
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
