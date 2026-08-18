import { ModularDialogStep } from "../types";
import { useModularDialogData } from "./useModularDialogData";
import { useModularDialogFlowState } from "./useModularDialogFlowState";
import { useModularDialogBackButton } from "./useModularDialogBackButton";
import { useMemo, useState } from "react";
import { useAssetSelection } from "./useAssetSelection";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useSelector } from "LLD/hooks/redux";
import { modularDialogSelectableNetworkIdsSelector } from "~/renderer/reducers/modularDialog";

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

  const selectableNetworkIds = useSelector(modularDialogSelectableNetworkIdsSelector);
  const { assetsToDisplay, disabledAssetIds } = useAssetSelection(
    sortedCryptoCurrencies,
    assetsSorted,
    selectableNetworkIds,
  );

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
    disabledAssetIds,
    selectableNetworkIds,
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
