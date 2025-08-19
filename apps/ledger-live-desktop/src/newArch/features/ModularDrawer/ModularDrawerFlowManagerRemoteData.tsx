import React, { useMemo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnimatePresence } from "framer-motion";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DRAWER_STEP, ModularDrawerFlowManagerProps, ModularDrawerStep } from "./types";
import AssetSelection from "./screens/AssetSelection";
import { NetworkSelection } from "./screens/NetworkSelection";
import { Title } from "./components/Title";
import { AccountSelection } from "./screens/AccountSelection";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useModularDrawerNavigation } from "./hooks/useModularDrawerNavigation";
import { useAssetSelection } from "./hooks/useAssetSelection";
import { useModularDrawerFlowState } from "./hooks/useModularDrawerFlowState";
import { haveOneCommonProvider } from "@ledgerhq/live-common/modularDrawer/utils/index";
import { BackButtonArrow } from "./components/BackButton";
import {
  buildProviderCoverageMap,
  filterProvidersByIds,
  extractProviderCurrencies,
} from "@ledgerhq/live-common/modularDrawer/utils/currencyUtils";
import { addTestnetCurrencies } from "LLD/utils/testnetCurrencies";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useAssetsData } from "./hooks/useAssetsData";
import { useModularDrawerConfiguration } from "./hooks/useModularDrawerConfiguration";
import { getLoadingStatus } from "./utils/getLoadingStatus";

const ModularDrawerFlowManagerRemoteData = ({
  currencies,
  drawerConfiguration,
  accounts$,
  flow,
  source,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const devMode = useEnv("MANAGER_DEV_MODE");
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();
  const [searchedValue, setSearchedValue] = useState<string>();
  const { assetsConfiguration, networkConfiguration } =
    useModularDrawerConfiguration(drawerConfiguration);
  const { data, isLoading, isSuccess, error } = useAssetsData({ search: searchedValue });
  const assetsSorted = data?.currenciesOrder.metaCurrencyIds
    .filter(currencyId => data?.cryptoAssets[currencyId])
    .map(currencyId => ({
      asset: data.cryptoAssets[currencyId],
      networks: Object.keys(data.cryptoAssets[currencyId].assetsIds).map(
        assetId => data.networks[assetId],
      ),
      interestRates: data.interestRates[currencyId],
      market: data.markets[currencyId],
    }));

  const loadingStatus: LoadingStatus = getLoadingStatus({ isLoading, isSuccess, error });

  const currenciesByProvider: CurrenciesByProviderId[] = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted.map(assetData => ({
      currenciesByNetwork: assetData.networks
        .map(network => data.cryptoOrTokenCurrencies[network.id])
        .filter(currency => currency !== undefined),
      providerId: assetData.asset.id,
    }));
  }, [assetsSorted, data]);
  const sortedCryptoCurrencies = useMemo(
    () => (assetsSorted || []).map(assetData => data?.cryptoOrTokenCurrencies[assetData.asset.id]),
    [assetsSorted, data?.cryptoOrTokenCurrencies],
  );

  const {
    assetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
    currencyIdsSet,
    setAssetsToDisplay,
  } = useAssetSelection(currencies, sortedCryptoCurrencies);

  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();
  const [originalAssetsToDisplay, setOriginalAssetsToDisplay] = useState<CryptoOrTokenCurrency[]>(
    [],
  );

  const isSelectAccountFlow = !!onAccountSelected;
  const hasOneNetwork = networksToDisplay?.length === 1;
  const hasOneCurrency = useMemo(() => {
    if (!isSuccess) return false;
    return haveOneCommonProvider(currenciesIdsArray, currenciesByProvider);
  }, [currenciesIdsArray, currenciesByProvider, isSuccess]);

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

  const handleBack = useMemo(() => {
    const canGoBackToAsset = !hasOneCurrency;
    const canGoBackToNetwork = !hasOneNetwork && networksToDisplay && networksToDisplay.length > 1;

    switch (currentStep) {
      case "NETWORK_SELECTION": {
        return canGoBackToAsset ? goBackToAssetSelection : undefined;
      }
      case "ACCOUNT_SELECTION": {
        if (
          (hasOneNetwork || !networksToDisplay || networksToDisplay.length <= 1) &&
          !hasOneCurrency
        ) {
          return goBackToAssetSelection;
        } else if (canGoBackToNetwork) {
          return goBackToNetworkSelection;
        }
        return undefined;
      }
      default: {
        return undefined;
      }
    }
  }, [
    currentStep,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    hasOneCurrency,
    hasOneNetwork,
    networksToDisplay,
  ]);

  const filteredCurrenciesByProvider = useMemo(() => {
    if (currencyIdsSet.size === 0) {
      return currenciesByProvider;
    }

    const providerCoverageMap = buildProviderCoverageMap(currenciesByProvider);
    const filtered = filterProvidersByIds(
      currenciesByProvider,
      currencyIdsSet,
      providerCoverageMap,
    );
    const allProviderCurrencies = extractProviderCurrencies(filtered);
    const currenciesEnhanced = devMode
      ? addTestnetCurrencies(allProviderCurrencies)
      : allProviderCurrencies;

    setAssetsToDisplay(currenciesEnhanced);
    setOriginalAssetsToDisplay(currenciesEnhanced);

    return filtered;
  }, [currenciesByProvider, currencyIdsSet, setAssetsToDisplay, devMode]);

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
              currenciesByProvider={filteredCurrenciesByProvider}
              setAssetsToDisplay={setAssetsToDisplay}
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
            currenciesByProvider={filteredCurrenciesByProvider}
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
