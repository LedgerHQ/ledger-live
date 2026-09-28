import React from "react";
import { AccountSelector } from "./screens/AccountSelector";
import AssetSelector from "./screens/AssetSelector";
import { NetworkSelector } from "./screens/NetworkSelector";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import SkeletonList from "./components/SkeletonList";
import { useModularDialogFlowViewModel } from "./useModularDialogFlowViewModel";
import { MODULAR_DIALOG_STEP, type ModularDialogFlowProps, type ModularDialogStep } from "./types";

export function ModularDialogFlow({
  children,
  fillAvailableHeight,
  onClose,
}: ModularDialogFlowProps) {
  const {
    assetsConfiguration,
    assetsSorted,
    assetsToDisplay,
    currentStep,
    description,
    disabledAssetIds,
    displayStep,
    errorInfo,
    handleAssetSelected,
    handleBack,
    handleClose,
    handleNetworkSelected,
    isAwaitingAutoSkip,
    isOpen,
    loadNext,
    loadingStatus,
    navigationDirection,
    networkConfiguration,
    networksToDisplay,
    onAccountSelected,
    refetch,
    selectableNetworkIds,
    selectedAsset,
    selectedNetwork,
    title,
    uiUseCase,
  } = useModularDialogFlowViewModel({ onClose });

  const renderStepContent = (step: ModularDialogStep) => {
    switch (step) {
      case MODULAR_DIALOG_STEP.ASSET_SELECTION:
        return (
          <AssetSelector
            assetsToDisplay={assetsToDisplay}
            providersLoadingStatus={loadingStatus}
            assetsConfiguration={assetsConfiguration}
            fillAvailableHeight={fillAvailableHeight}
            onAssetSelected={handleAssetSelected}
            loadNext={loadNext}
            errorInfo={errorInfo}
            refetch={refetch}
            assetsSorted={assetsSorted}
            disabledAssetIds={disabledAssetIds}
          />
        );
      case MODULAR_DIALOG_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelector
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
            selectedAssetName={selectedAsset?.name}
            selectableNetworkIds={selectableNetworkIds}
          />
        );
      case MODULAR_DIALOG_STEP.ACCOUNT_SELECTION:
        if (selectedAsset && selectedNetwork && onAccountSelected) {
          return (
            <AccountSelector
              asset={selectedAsset}
              onAccountSelected={onAccountSelected}
              uiUseCase={uiUseCase}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  const content = (
    <AnimatedScreenWrapper
      key={`${displayStep}-${navigationDirection}`}
      fillAvailableHeight={fillAvailableHeight}
      screenKey={displayStep}
      direction={navigationDirection}
    >
      {isAwaitingAutoSkip ? <SkeletonList /> : renderStepContent(currentStep)}
    </AnimatedScreenWrapper>
  );

  return (
    <>
      {children({
        content,
        currentStep: displayStep,
        title,
        description,
        hasBackButton: Boolean(handleBack),
        isOpen,
        navigationDirection,
        onBack: handleBack,
        onClose: handleClose,
      })}
    </>
  );
}
