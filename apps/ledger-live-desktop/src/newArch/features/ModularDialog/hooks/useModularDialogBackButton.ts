import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModularDialogStep } from "../types";
import { useSelector } from "react-redux";
import { modularDrawerSearchedSelector } from "~/renderer/reducers/modularDrawer";

interface UseModularDialogBackButtonProps {
  currentStep: ModularDialogStep;
  goBackToAssetSelection?: () => void;
  goBackToNetworkSelection?: () => void;
  hasOneCurrency: boolean;
  networksToDisplay?: CryptoOrTokenCurrency[];
}

export function useModularDialogBackButton({
  currentStep,
  goBackToAssetSelection,
  goBackToNetworkSelection,
  hasOneCurrency,
  networksToDisplay,
}: UseModularDialogBackButtonProps) {
  const searchedValue = useSelector(modularDrawerSearchedSelector);
  const handleBack = useMemo(() => {
    const canGoBackToAsset = !hasOneCurrency || !!searchedValue;
    const canGoBackToNetwork = networksToDisplay && networksToDisplay.length > 1;

    switch (currentStep) {
      case "NETWORK_SELECTION": {
        return canGoBackToAsset ? goBackToAssetSelection : undefined;
      }
      case "ACCOUNT_SELECTION": {
        if ((!networksToDisplay || networksToDisplay.length === 1) && canGoBackToAsset) {
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
    networksToDisplay,
    searchedValue,
  ]);

  return {
    handleBack,
  };
}
