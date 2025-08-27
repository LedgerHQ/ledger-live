import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModularDrawerStep } from "../types";

interface UseModularDrawerBackButtonProps {
  currentStep: ModularDrawerStep;
  goBackToAssetSelection?: () => void;
  goBackToNetworkSelection?: () => void;
  hasOneCurrency: boolean;
  hasOneNetwork: boolean;
  networksToDisplay?: CryptoOrTokenCurrency[];
  searchedValue?: string;
}

export function useModularDrawerBackButton({
  currentStep,
  goBackToAssetSelection,
  goBackToNetworkSelection,
  hasOneCurrency,
  hasOneNetwork,
  networksToDisplay,
  searchedValue,
}: UseModularDrawerBackButtonProps) {
  const handleBack = useMemo(() => {
    const canGoBackToAsset = !hasOneCurrency || !!searchedValue;
    const canGoBackToNetwork = !hasOneNetwork && networksToDisplay && networksToDisplay.length > 1;

    switch (currentStep) {
      case "NETWORK_SELECTION": {
        return canGoBackToAsset ? goBackToAssetSelection : undefined;
      }
      case "ACCOUNT_SELECTION": {
        if (
          (hasOneNetwork || !networksToDisplay || networksToDisplay.length <= 1) &&
          canGoBackToAsset
        ) {
          return goBackToAssetSelection;
        } else if (canGoBackToNetwork) {
          return goBackToNetworkSelection;
        }
        return undefined;
      }
      default: {
        return undefined;
      }
    }
  }, [
    currentStep,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    hasOneCurrency,
    hasOneNetwork,
    networksToDisplay,
    searchedValue,
  ]);

  return {
    handleBack,
  };
}
