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
import { setSearchedValue } from "~/renderer/reducers/modularDrawer";
import { useModularDrawerConfiguration } from "./hooks/useModularDrawerConfiguration";

const ModularDrawerFlowManager = ({
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  accounts$,
  flow,
  source,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const currencyIds = useMemo(() => (currencies || []).map(currency => currency.id), [currencies]);
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();

  useEffect(() => {
    return () => {
      // Reset search value when the drawer closes/unmounts
      dispatch(setSearchedValue(undefined));
    };
  }, [dispatch]);

  const {
    error,
    refetch,
    loadingStatus,
    currenciesByProvider,
    assetsToDisplay,
    networksToDisplay,
    selectedAsset,
    selectedNetwork,
    hasOneCurrency,
    handleAssetSelected,
    handleNetworkSelected,
    handleBack,
    loadNext,
  } = useModularDrawerRemoteData({
    currentStep,
    currencyIds,
    goToStep,
    onAssetSelected,
    isSelectAccountFlow: Boolean(onAccountSelected),
    flow,
    useCase,
    areCurrenciesFiltered,
  });

  const { assetsConfiguration, networkConfiguration } =
    useModularDrawerConfiguration(drawerConfiguration);

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case MODULAR_DRAWER_STEP.ASSET_SELECTION:
        return (
          <AssetSelection
            assetsToDisplay={assetsToDisplay}
            providersLoadingStatus={loadingStatus}
            assetsConfiguration={assetsConfiguration}
            currenciesByProvider={currenciesByProvider}
            onAssetSelected={handleAssetSelected}
            flow={flow}
            source={source}
            hasOneCurrency={hasOneCurrency}
            loadNext={loadNext}
            error={!!error}
            refetch={refetch}
          />
        );
      case MODULAR_DRAWER_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelection
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            currenciesByProvider={currenciesByProvider}
            flow={flow}
            source={source}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
            accounts$={accounts$}
          />
        );
      case MODULAR_DRAWER_STEP.ACCOUNT_SELECTION:
        if (selectedAsset && selectedNetwork && onAccountSelected) {
          return (
            <AccountSelection
              asset={selectedAsset}
              accounts$={accounts$}
              onAccountSelected={onAccountSelected}
              flow={flow}
              source={source}
            />
          );
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
