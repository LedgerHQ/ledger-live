import React from "react";
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

const ModularDrawerFlowManagerRemoteData = ({
  currencies,
  drawerConfiguration,
  accounts$,
  flow,
  source,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();

  const {
    error,
    loadingStatus,
    assetsConfiguration,
    networkConfiguration,
    currenciesByProvider,
    assetsToDisplay,
    filteredSortedCryptoCurrencies,
    originalAssetsToDisplay,
    searchedValue,
    setSearchedValue,
    networksToDisplay,
    selectedAsset,
    selectedNetwork,
    hasOneCurrency,
    handleAssetSelected,
    handleNetworkSelected,
    handleAccountSelected,
    handleBack,
  } = useModularDrawerRemoteData({
    currentStep,
    currencies,
    drawerConfiguration,
    goToStep,
    onAssetSelected,
    onAccountSelected,
    flow,
  });

  const renderStepContent = (step: ModularDrawerStep) => {
    // TODO: We should find a better way to handle that. THe issue is that we always display AssetSelection screen
    // but in some cases we don't want to trigger analytics events as it may have been dismissed automatically depending on the flow.
    // For now we just return null if we are in ASSET_SELECTION step and there is only one currency.
    // This is a temporary solution until we find a better way to handle this but it works as we just don't render a skipped step.
    switch (step) {
      case MODULAR_DRAWER_STEP.ASSET_SELECTION:
        if (!hasOneCurrency) {
          return (
            <AssetSelection
              assetsToDisplay={assetsToDisplay}
              providersLoadingStatus={loadingStatus}
              originalAssetsToDisplay={originalAssetsToDisplay}
              sortedCryptoCurrencies={filteredSortedCryptoCurrencies}
              defaultSearchValue={searchedValue}
              assetsConfiguration={assetsConfiguration}
              currenciesByProvider={currenciesByProvider}
              setAssetsToDisplay={() => {}} // Not needed anymore with the search filtering done by the backend
              setSearchedValue={setSearchedValue}
              onAssetSelected={handleAssetSelected}
              flow={flow}
              source={source}
            />
          );
        }
        return null;
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
        if (selectedAsset && selectedNetwork) {
          return (
            <AccountSelection
              asset={selectedAsset}
              accounts$={accounts$}
              onAccountSelected={handleAccountSelected}
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
          {error ? (
            <>{JSON.stringify(error)}</> // TODO: Handle error state
          ) : (
            <>
              <Title step={currentStep} />
              {renderStepContent(currentStep)}
            </>
          )}
        </AnimatedScreenWrapper>
      </AnimatePresence>
    </>
  );
};

export default ModularDrawerFlowManagerRemoteData;
