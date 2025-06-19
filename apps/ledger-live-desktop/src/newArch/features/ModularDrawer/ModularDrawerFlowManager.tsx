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
import { haveOneCommonProvider } from "./utils/haveOneCommonProvider";
import { BackButtonArrow } from "./components/BackButton";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getTokenOrCryptoCurrencyById } from "@ledgerhq/live-common/deposit/helper";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";

type Props = {
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
}: Props) => {
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

    const providerIdToCoveringProviders = new Map<string, Set<string>>();

    for (const provider of currenciesByProvider) {
      for (const currency of provider.currenciesByNetwork) {
        if (!providerIdToCoveringProviders.has(currency.id)) {
          providerIdToCoveringProviders.set(currency.id, new Set());
        }
        providerIdToCoveringProviders.get(currency.id)!.add(provider.providerId);
      }
    }

    const filtered: typeof currenciesByProvider = [];

    for (const provider of currenciesByProvider) {
      const filteredCurrencies = provider.currenciesByNetwork.filter(currency =>
        currencyIdsSet.has(currency.id),
      );

      if (filteredCurrencies.length === 0) continue;

      const providerHasOwnCurrency = provider.currenciesByNetwork.some(
        currency => currency.id === provider.providerId,
      );

      if (!providerHasOwnCurrency) {
        const coveringProviders = providerIdToCoveringProviders.get(provider.providerId);
        const isProviderIdCoveredElsewhere = coveringProviders && coveringProviders.size > 1;

        if (isProviderIdCoveredElsewhere) continue;
      }

      if (filteredCurrencies.length === provider.currenciesByNetwork.length) {
        filtered.push(provider);
      } else {
        filtered.push({
          ...provider,
          currenciesByNetwork: filteredCurrencies,
        });
      }
    }

    const safeCurrencyLookup = (id: string): CryptoOrTokenCurrency | null => {
      try {
        return getTokenOrCryptoCurrencyById(id);
      } catch {
        return null;
      }
    };

    const isProviderToken = (currency: CryptoOrTokenCurrency, providerId: string): boolean => {
      return (
        isTokenCurrency(currency) && currency.id.toLowerCase().includes(providerId.toLowerCase())
      );
    };

    // This is a trick to ensure that we display the provider currency in the assetsSelection screen if we only have the provided currencies.
    // For some currencies the providerId is not corresponding to any ledgerId so we will fallback to the first currency of the provider
    // This will limit the issue related to mapping services until the API
    const getProviderCurrency = (provider: (typeof filtered)[0]): CryptoOrTokenCurrency | null => {
      const providerToken = provider.currenciesByNetwork.find(currency => {
        const currencyObj = safeCurrencyLookup(currency.id);
        return currencyObj && isProviderToken(currencyObj, provider.providerId);
      });

      if (providerToken) {
        return safeCurrencyLookup(providerToken.id);
      }

      return (
        safeCurrencyLookup(provider.providerId) ??
        safeCurrencyLookup(provider.currenciesByNetwork[0]?.id)
      );
    };

    const allProviderCurrencies = filtered.flatMap(provider => {
      const currency = getProviderCurrency(provider);
      return currency ? [currency] : [];
    });

    setAssetsToDisplay(allProviderCurrencies);
    setOriginalAssetsToDisplay(allProviderCurrencies);

    return filtered;
  }, [currenciesByProvider, currencyIdsSet, setAssetsToDisplay]);

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
