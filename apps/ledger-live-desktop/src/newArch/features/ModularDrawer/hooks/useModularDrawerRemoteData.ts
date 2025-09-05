import { ModularDrawerFlowManagerProps, ModularDrawerStep } from "../types";
import { useModularDrawerData } from "./useModularDrawerData";
import { useModularDrawerFiltering } from "./useModularDrawerFiltering";
import { useModularDrawerFlowState } from "./useModularDrawerFlowState";
import { useModularDrawerBackButton } from "./useModularDrawerBackButton";
import { useModularDrawerConfiguration } from "./useModularDrawerConfiguration";

interface UseModularDrawerRemoteDataProps {
  currentStep: ModularDrawerStep;
  currencies: ModularDrawerFlowManagerProps["currencies"];
  drawerConfiguration: ModularDrawerFlowManagerProps["drawerConfiguration"];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  goToStep: (step: ModularDrawerStep) => void;
  onAssetSelected: ModularDrawerFlowManagerProps["onAssetSelected"];
  onAccountSelected: ModularDrawerFlowManagerProps["onAccountSelected"];
  flow: ModularDrawerFlowManagerProps["flow"];
}

export function useModularDrawerRemoteData({
  currentStep,
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  goToStep,
  onAssetSelected,
  onAccountSelected,
  flow,
}: UseModularDrawerRemoteDataProps) {
  const { assetsConfiguration, networkConfiguration } =
    useModularDrawerConfiguration(drawerConfiguration);

  const {
    currenciesByProvider,
    sortedCryptoCurrencies,
    error,
    refetch,
    isSuccess,
    loadingStatus,
    loadNext,
  } = useModularDrawerData({ currencies, useCase, areCurrenciesFiltered });

  const {
    assetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
    setAssetsToDisplay,
    networksToDisplay,
    setNetworksToDisplay,
    originalAssetsToDisplay,
    hasOneNetwork,
    hasOneCurrency,
    filteredCurrenciesByProvider,
  } = useModularDrawerFiltering({
    currencies,
    currenciesByProvider,
    sortedCryptoCurrencies,
    isSuccess,
  });

  const isSelectAccountFlow = Boolean(onAccountSelected);

  const {
    selectedAsset,
    selectedNetwork,
    handleNetworkSelected,
    handleAssetSelected,
    handleAccountSelected,
    goBackToAssetSelection,
    goBackToNetworkSelection,
  } = useModularDrawerFlowState({
    currenciesByProvider,
    sortedCryptoCurrencies,
    currenciesIdsArray,
    isSelectAccountFlow,
    setNetworksToDisplay,
    goToStep,
    onAssetSelected,
    onAccountSelected,
    flow,
    hasOneCurrency,
  });

  const { handleBack } = useModularDrawerBackButton({
    currentStep,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    hasOneCurrency,
    hasOneNetwork,
    networksToDisplay,
  });

  return {
    error,
    refetch,
    loadingStatus,
    assetsConfiguration,
    networkConfiguration,
    currenciesByProvider: filteredCurrenciesByProvider,
    assetsToDisplay,
    filteredSortedCryptoCurrencies,
    originalAssetsToDisplay,
    setAssetsToDisplay,
    networksToDisplay,
    selectedAsset,
    selectedNetwork,
    hasOneCurrency,
    handleAssetSelected,
    handleNetworkSelected,
    handleAccountSelected,
    handleBack,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    loadNext,
  };
}
