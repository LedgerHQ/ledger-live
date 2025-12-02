import React, { useCallback, useMemo } from "react";
import { MODULAR_DRAWER_STEP, ModularDrawerStep, ModularDrawerFlowManagerProps } from "../types";
import { useModularDrawerNavigation } from "./useModularDialogNavigation";
import { useModularDrawerRemoteData } from "./useModularDialogRemoteData";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import AssetSelector from "../screens/AssetSelector";
import { NetworkSelector } from "../screens/NetworkSelector";
import { AccountSelector } from "../screens/AccountSelector";

type UseModularDialogFlowParams = Pick<
  ModularDrawerFlowManagerProps,
  | "currencies"
  | "drawerConfiguration"
  | "useCase"
  | "areCurrenciesFiltered"
  | "onAssetSelected"
  | "onAccountSelected"
>;

export function useModularDialogFlow({
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  onAssetSelected,
  onAccountSelected,
}: UseModularDialogFlowParams) {
  const currencyIds = useMemo(() => currencies, [currencies]);
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();

  const {
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
    loadNext,
    assetsSorted,
  } = useModularDrawerRemoteData({
    currentStep,
    currencyIds,
    goToStep,
    onAssetSelected,
    isSelectAccountFlow: Boolean(onAccountSelected),
    useCase,
    areCurrenciesFiltered,
  });

  const { assetsConfiguration, networkConfiguration } = useModularDrawerConfiguration(
    "lldModularDrawer",
    drawerConfiguration,
  );

  const renderStepContent = useCallback(
    (step: ModularDrawerStep) => {
      switch (step) {
        case MODULAR_DRAWER_STEP.ASSET_SELECTION:
          return (
            <AssetSelector
              assetsToDisplay={assetsToDisplay}
              providersLoadingStatus={loadingStatus}
              assetsConfiguration={assetsConfiguration}
              onAssetSelected={handleAssetSelected}
              loadNext={loadNext}
              errorInfo={errorInfo}
              refetch={refetch}
              assetsSorted={assetsSorted}
            />
          );
        case MODULAR_DRAWER_STEP.NETWORK_SELECTION:
          return (
            <NetworkSelector
              networks={networksToDisplay}
              networksConfiguration={networkConfiguration}
              onNetworkSelected={handleNetworkSelected}
              selectedAssetId={selectedAsset?.id}
            />
          );
        case MODULAR_DRAWER_STEP.ACCOUNT_SELECTION:
          if (selectedAsset && selectedNetwork && onAccountSelected) {
            return <AccountSelector asset={selectedAsset} onAccountSelected={onAccountSelected} />;
          }
          return null;
        default:
          return null;
      }
    },
    [
      assetsToDisplay,
      loadingStatus,
      assetsConfiguration,
      handleAssetSelected,
      loadNext,
      errorInfo,
      refetch,
      assetsSorted,
      networksToDisplay,
      networkConfiguration,
      handleNetworkSelected,
      selectedAsset,
      selectedNetwork,
      onAccountSelected,
    ],
  );

  return {
    currentStep,
    navigationDirection,
    handleBack,
    renderStepContent,
  };
}
