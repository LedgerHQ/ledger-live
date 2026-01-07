import { ModularDialogStep } from "../types";
import { useModularDialogData } from "./useModularDialogData";
import { useModularDialogFlowState } from "./useModularDialogFlowState";
import { useModularDialogBackButton } from "./useModularDialogBackButton";
import { useMemo, useState } from "react";
import { useAssetSelection } from "./useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

interface UseModularDialogRemoteDataProps {
  currentStep: ModularDialogStep;
  goToStep: (step: ModularDialogStep) => void;
}

export function useModularDialogRemoteData({
  currentStep,
  goToStep,
}: UseModularDialogRemoteDataProps) {
  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();

  const {
    sortedCryptoCurrencies,
    error,
    errorInfo,
    refetch,
    loadingStatus,
    loadNext,
    assetsSorted,
  } = useModularDialogData();

  const { assetsToDisplay } = useAssetSelection(sortedCryptoCurrencies);

  const {
    selectedAsset,
    selectedNetwork,
    handleNetworkSelected,
    handleAssetSelected,
    goBackToAssetSelection,
    goBackToNetworkSelection,
  } = useModularDialogFlowState({
    assets: assetsSorted,
    sortedCryptoCurrencies,
    setNetworksToDisplay,
    goToStep,
  });

  const hasOneCurrency = useMemo(() => assetsSorted?.length === 1, [assetsSorted]);

  const { handleBack } = useModularDialogBackButton({
    currentStep,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    hasOneCurrency,
    networksToDisplay,
  });

  return {
    error,
    errorInfo,
    refetch,
    loadingStatus,
    assetsToDisplay,
    networksToDisplay,
    selectedAsset,
    selectedNetwork,
    handleAssetSelected,
    handleNetworkSelected,
    handleBack,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    loadNext,
    assetsSorted,
  };
}
