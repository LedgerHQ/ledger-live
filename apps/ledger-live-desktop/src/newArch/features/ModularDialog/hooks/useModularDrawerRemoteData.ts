import { ModularDrawerFlowManagerProps, ModularDrawerStep } from "../types";
import { useModularDrawerData } from "./useModularDrawerData";
import { useModularDrawerFlowState } from "./useModularDrawerFlowState";
import { useModularDrawerBackButton } from "./useModularDrawerBackButton";
import { useMemo, useState } from "react";
import { useAssetSelection } from "./useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

interface UseModularDrawerRemoteDataProps {
  currentStep: ModularDrawerStep;
  currencyIds: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  goToStep: (step: ModularDrawerStep) => void;
  onAssetSelected: ModularDrawerFlowManagerProps["onAssetSelected"];
  isSelectAccountFlow: boolean;
}

export function useModularDrawerRemoteData({
  currentStep,
  currencyIds,
  useCase,
  areCurrenciesFiltered,
  goToStep,
  onAssetSelected,
  isSelectAccountFlow,
}: UseModularDrawerRemoteDataProps) {
  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();

  const {
    sortedCryptoCurrencies,
    error,
    errorInfo,
    refetch,
    loadingStatus,
    loadNext,
    assetsSorted,
  } = useModularDrawerData({ currencyIds, useCase, areCurrenciesFiltered });

  const { assetsToDisplay } = useAssetSelection(currencyIds, sortedCryptoCurrencies);

  const {
    selectedAsset,
    selectedNetwork,
    handleNetworkSelected,
    handleAssetSelected,
    goBackToAssetSelection,
    goBackToNetworkSelection,
  } = useModularDrawerFlowState({
    assets: assetsSorted,
    sortedCryptoCurrencies,
    currencyIds,
    isSelectAccountFlow,
    setNetworksToDisplay,
    goToStep,
    onAssetSelected,
  });

  const hasOneCurrency = useMemo(() => assetsSorted?.length === 1, [assetsSorted]);

  const { handleBack } = useModularDrawerBackButton({
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
