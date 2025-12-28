import { useCallback } from "react";
import { ModularDrawerStep } from "../types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector, useDispatch } from "~/context/store";
import {
  modularDrawerEnableAccountSelectionSelector,
  modularDrawerStepSelector,
  setStep,
} from "~/reducers/modularDrawer";

type UseStepNavigationParams = {
  availableNetworksCount: number;
  hasOneCurrency: boolean;
  resetSelection: () => void;
  clearNetwork: () => void;
  selectNetwork?: (n: CryptoOrTokenCurrency) => void;
  navigateToDeviceWithCurrency: (selectedCurrency: CryptoOrTokenCurrency) => void;
};

export function useStepNavigation({
  availableNetworksCount,
  hasOneCurrency,
  resetSelection,
  clearNetwork,
  selectNetwork,
  navigateToDeviceWithCurrency,
}: UseStepNavigationParams) {
  const enableAccountSelection = useSelector(modularDrawerEnableAccountSelectionSelector);
  const dispatch = useDispatch();
  const canGoBackToAsset = !hasOneCurrency;
  const canGoBackToNetwork = availableNetworksCount > 1;

  const backToAsset = useCallback(() => {
    resetSelection();
    dispatch(setStep(ModularDrawerStep.Asset));
  }, [resetSelection, dispatch]);

  const backToNetwork = useCallback(() => {
    clearNetwork();
    dispatch(setStep(ModularDrawerStep.Network));
  }, [clearNetwork, dispatch]);

  const currentStep = useSelector(modularDrawerStepSelector);
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
        dispatch(setStep(ModularDrawerStep.Account));
      } else {
        navigateToDeviceWithCurrency(selectedAsset);
      }
    },
    [dispatch, selectNetwork, enableAccountSelection, navigateToDeviceWithCurrency],
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
