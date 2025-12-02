import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AnimatePresence } from "framer-motion";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DRAWER_STEP, ModularDrawerFlowManagerProps, ModularDrawerStep } from "./types";
import AssetSelection from "./screens/AssetSelection";
import { NetworkSelection } from "./screens/NetworkSelection";
import { Title } from "./components/Title";
import { AccountSelection } from "./screens/AccountSelection";
import { useModularDrawerNavigation } from "./hooks/useModularDrawerNavigation";
import { BackButtonArrow } from "./components/BackButton";
import { useModularDrawerRemoteData } from "./hooks/useModularDrawerRemoteData";
import { resetModularDrawerState } from "~/renderer/reducers/modularDrawer";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";

const ModularDrawerFlowManager = ({
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const currencyIds = useMemo(() => currencies, [currencies]);
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();

  useEffect(() => {
    return () => {
      dispatch(resetModularDrawerState());
    };
  }, [dispatch]);

  const {
    error,
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

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case MODULAR_DRAWER_STEP.ASSET_SELECTION:
        return (
          <AssetSelection
            assetsToDisplay={assetsToDisplay}
            providersLoadingStatus={loadingStatus}
            assetsConfiguration={assetsConfiguration}
            onAssetSelected={handleAssetSelected}
            loadNext={loadNext}
            error={!!error}
            refetch={refetch}
            assetsSorted={assetsSorted}
          />
        );
      case MODULAR_DRAWER_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelection
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
          />
        );
      case MODULAR_DRAWER_STEP.ACCOUNT_SELECTION:
        if (selectedAsset && selectedNetwork && onAccountSelected) {
          return <AccountSelection asset={selectedAsset} onAccountSelected={onAccountSelected} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <>
      {handleBack && <BackButtonArrow onBackClick={handleBack} />}
      <AnimatePresence initial={false} custom={navigationDirection} mode="sync">
        <AnimatedScreenWrapper
          key={currentStep}
          screenKey={currentStep}
          direction={navigationDirection}
        >
          <Title step={currentStep} />
          {renderStepContent(currentStep)}
        </AnimatedScreenWrapper>
      </AnimatePresence>
    </>
  );
};

export default ModularDrawerFlowManager;
