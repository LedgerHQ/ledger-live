import { ModularDrawerFlowManagerProps, ModularDrawerStep } from "../types";
import { useModularDrawerData } from "./useModularDrawerData";
import { useModularDrawerFiltering } from "./useModularDrawerFiltering";
import { useModularDrawerFlowState } from "./useModularDrawerFlowState";
import { useModularDrawerBackButton } from "./useModularDrawerBackButton";

interface UseModularDrawerRemoteDataProps {
  currentStep: ModularDrawerStep;
  currencyIds: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  goToStep: (step: ModularDrawerStep) => void;
  onAssetSelected: ModularDrawerFlowManagerProps["onAssetSelected"];
  isSelectAccountFlow: boolean;
  flow: ModularDrawerFlowManagerProps["flow"];
}

export function useModularDrawerRemoteData({
  currentStep,
  currencyIds,
  useCase,
  areCurrenciesFiltered,
  goToStep,
  onAssetSelected,
  isSelectAccountFlow,
  flow,
}: UseModularDrawerRemoteDataProps) {
  const {
    currenciesByProvider,
    sortedCryptoCurrencies,
    error,
    refetch,
    isSuccess,
    loadingStatus,
    loadNext,
  } = useModularDrawerData({ currencyIds, useCase, areCurrenciesFiltered });

  const {
    assetsToDisplay,
    setAssetsToDisplay,
    networksToDisplay,
    setNetworksToDisplay,
    hasOneCurrency,
    filteredCurrenciesByProvider,
  } = useModularDrawerFiltering({
    currencyIds,
    currenciesByProvider,
    sortedCryptoCurrencies,
    isSuccess,
  });

  const {
    selectedAsset,
    selectedNetwork,
    handleNetworkSelected,
    handleAssetSelected,
    goBackToAssetSelection,
    goBackToNetworkSelection,
  } = useModularDrawerFlowState({
    currenciesByProvider,
    sortedCryptoCurrencies,
    currencyIds,
    isSelectAccountFlow,
    setNetworksToDisplay,
    goToStep,
    onAssetSelected,
    flow,
    hasOneCurrency,
  });

  const { handleBack } = useModularDrawerBackButton({
    currentStep,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    hasOneCurrency,
    networksToDisplay,
  });

  return {
    error,
    refetch,
    loadingStatus,
    currenciesByProvider: filteredCurrenciesByProvider,
    assetsToDisplay,
    setAssetsToDisplay,
    networksToDisplay,
    selectedAsset,
    selectedNetwork,
    hasOneCurrency,
    handleAssetSelected,
    handleNetworkSelected,
    handleBack,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    loadNext,
  };
}
