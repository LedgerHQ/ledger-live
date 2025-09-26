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
  const {
    sortedCryptoCurrencies,
    error,
    refetch,
    isSuccess,
    loadingStatus,
    loadNext,
    assetsSorted,
  } = useModularDrawerData({ currencyIds, useCase, areCurrenciesFiltered });

  const { assetsToDisplay, networksToDisplay, setNetworksToDisplay, hasOneCurrency } =
    useModularDrawerFiltering({
      currencyIds,
      assets: assetsSorted,
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
    assets: assetsSorted,
    sortedCryptoCurrencies,
    currencyIds,
    isSelectAccountFlow,
    setNetworksToDisplay,
    goToStep,
    onAssetSelected,
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
    assetsToDisplay,

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
    assetsSorted,
  };
}
