import React, { useMemo, useState } from "react";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { AnimatePresence } from "framer-motion";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DRAWER_STEP, ModularDrawerStep } from "./types";
import AssetSelection from "./screens/AssetSelection";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook";
import { NetworkSelection } from "./screens/NetworkSelection";
import { Title } from "./components/Title";
import { AccountSelection } from "./screens/AccountSelection";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useModularDrawerNavigation } from "./hooks/useModularDrawerNavigation";
import { useAssetSelection } from "./hooks/useAssetSelection";
import { useModularDrawerFlowState } from "./hooks/useModularDrawerFlowState";
import SkeletonList from "./components/SkeletonList";
import { haveOneCommonProvider } from "@ledgerhq/live-common/modularDrawer/utils/haveOneCommonProvider";
import { BackButtonArrow } from "./components/BackButton";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  buildProviderCoverageMap,
  filterProvidersByIds,
  extractProviderCurrencies,
} from "./utils/currencyUtils";
import { addTestnetCurrencies } from "LLD/utils/testnetCurrencies";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";

export type ModularDrawerFlowManagerProps = {
  currencies: CryptoOrTokenCurrency[];
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  accounts$?: Observable<WalletAPIAccount[]>;
  source: string;
  flow: string;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
};

const assetConfigurationDisabled: EnhancedModularDrawerConfiguration["assets"] = {
  rightElement: "undefined",
  leftElement: "undefined",
  filter: "undefined",
};

const networkConfigurationDisabled: EnhancedModularDrawerConfiguration["networks"] = {
  rightElement: "undefined",
  leftElement: "undefined",
};

const ModularDrawerFlowManager = ({
  currencies,
  drawerConfiguration,
  accounts$,
  flow,
  source,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const devMode = useEnv("MANAGER_DEV_MODE");
  const featureModularDrawer = useFeature("lldModularDrawer");
  const modularizationEnabled = featureModularDrawer?.params?.enableModularization ?? false;
  const assetConfiguration = modularizationEnabled
    ? drawerConfiguration?.assets
    : assetConfigurationDisabled;
  const networkConfiguration = modularizationEnabled
    ? drawerConfiguration?.networks
    : networkConfigurationDisabled;

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider, sortedCryptoCurrencies } = useMemo(() => {
    return {
      currenciesByProvider: result.currenciesByProvider ?? [],
      sortedCryptoCurrencies: result.sortedCryptoCurrencies ?? [],
    };
  }, [result]);

  const isReadyToBeDisplayed = [LoadingStatus.Success].includes(providersLoadingStatus);

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

  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();
  const isSelectAccountFlow = !!onAccountSelected;
  const hasOneNetwork = networksToDisplay?.length === 1;
  const hasOneCurrency = useMemo(() => {
    if (!isReadyToBeDisplayed) return false;
    return haveOneCommonProvider(currenciesIdsArray, currenciesByProvider);
  }, [currenciesIdsArray, currenciesByProvider, isReadyToBeDisplayed]);

  const {
    selectedAsset,
    selectedNetwork,
    searchedValue,
    setSearchedValue,
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
              providersLoadingStatus={providersLoadingStatus}
              originalAssetsToDisplay={originalAssetsToDisplay}
              sortedCryptoCurrencies={filteredSortedCryptoCurrencies}
              defaultSearchValue={searchedValue}
              assetsConfiguration={assetConfiguration}
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
          {isReadyToBeDisplayed ? (
            <>
              <Title step={currentStep} />
              {renderStepContent(currentStep)}
            </>
          ) : (
            <SkeletonList />
          )}
        </AnimatedScreenWrapper>
      </AnimatePresence>
    </>
  );
};

export default ModularDrawerFlowManager;
