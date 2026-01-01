import { ModularDialogFlowManagerProps, ModularDialogStep } from "../types";
import { useModularDialogData } from "./useModularDialogData";
import { useModularDialogFlowState } from "./useModularDialogFlowState";
import { useModularDialogBackButton } from "./useModularDialogBackButton";
import { useMemo, useState } from "react";
import { useAssetSelection } from "./useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

interface UseModularDialogRemoteDataProps {
  currentStep: ModularDialogStep;
  currencyIds: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  goToStep: (step: ModularDialogStep) => void;
  onAssetSelected: ModularDialogFlowManagerProps["onAssetSelected"];
  isSelectAccountFlow: boolean;
}

export function useModularDialogRemoteData({
  currentStep,
  currencyIds,
  useCase,
  areCurrenciesFiltered,
  goToStep,
  onAssetSelected,
  isSelectAccountFlow,
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
  } = useModularDialogData({ currencyIds, useCase, areCurrenciesFiltered });

  const { assetsToDisplay } = useAssetSelection(currencyIds, sortedCryptoCurrencies);

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
    currencyIds,
    isSelectAccountFlow,
    setNetworksToDisplay,
    goToStep,
    onAssetSelected,
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
