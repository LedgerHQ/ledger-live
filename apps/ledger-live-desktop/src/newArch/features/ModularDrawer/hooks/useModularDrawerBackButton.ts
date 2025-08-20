import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

interface UseModularDrawerBackButtonProps {
  goBackToAssetSelection: (() => void) | undefined;
  goBackToNetworkSelection: (() => void) | undefined;
  hasOneCurrency: boolean;
  hasOneNetwork: boolean;
  networksToDisplay: CryptoOrTokenCurrency[] | undefined;
}

export function useModularDrawerBackButton({
  goBackToAssetSelection,
  goBackToNetworkSelection,
  hasOneCurrency,
  hasOneNetwork,
  networksToDisplay,
}: UseModularDrawerBackButtonProps) {
  const handleBack = useMemo(() => {
    const canGoBackToAsset = !hasOneCurrency;
    const canGoBackToNetwork = !hasOneNetwork && networksToDisplay && networksToDisplay.length > 1;

    switch (true) {
      case canGoBackToAsset:
        return goBackToAssetSelection;
      case canGoBackToNetwork:
        return goBackToNetworkSelection;
      default:
        return undefined;
    }
  }, [
    goBackToAssetSelection,
    goBackToNetworkSelection,
    hasOneCurrency,
    hasOneNetwork,
    networksToDisplay,
  ]);

  return {
    handleBack,
  };
}
