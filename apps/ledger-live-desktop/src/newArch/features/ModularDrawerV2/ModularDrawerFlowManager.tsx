import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { AnimatePresence } from "framer-motion";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { ModularDrawerStep, NavigationDirection } from "./types";
import AssetSelection from "./screens/AssetSelection";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook";
import {
  CurrenciesByProviderId,
  LoadingBasedGroupedCurrencies,
} from "@ledgerhq/live-common/deposit/type";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { Box } from "@ledgerhq/react-ui/index";
import { NetworkSelection } from "./screens/NetworkSelection";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Header } from "./components/Header";

type Props = {
  currencies: CryptoOrTokenCurrency[];
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  accounts$?: Observable<WalletAPIAccount[]>;
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
};

const ModularDrawerFlowManager = ({
  currencies,
  drawerConfiguration,
  accounts$,
  onAssetSelected,
  onAccountSelected,
}: Props) => {
  const { assets: assetConfiguration, networks: networkConfiguration } = drawerConfiguration || {};

  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();
  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency>();
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency>();
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>("FORWARD");
  const [searchedValue, setSearchedValue] = useState<string>();
  const [currentStep, setCurrentStep] = useState<ModularDrawerStep>("ASSET_SELECTION");
  const [providers, setProviders] = useState<CurrenciesByProviderId | undefined>(undefined);
  const [backButtonDisabled, setBackButtonDisabled] = useState(true);

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider, sortedCryptoCurrencies } = result;

  const currenciesIdsArray = useMemo(() => currencies.map(currency => currency.id), [currencies]);

  const filteredSortedCryptoCurrencies = useMemo(
    () => sortedCryptoCurrencies.filter(currency => currenciesIdsArray.includes(currency.id)),
    [sortedCryptoCurrencies, currenciesIdsArray],
  );

  const [assetsToDisplay, setAssetsToDisplay] = useState<CryptoOrTokenCurrency[]>(
    filteredSortedCryptoCurrencies,
  );

  useEffect(() => {
    setAssetsToDisplay(filteredSortedCryptoCurrencies);
  }, [filteredSortedCryptoCurrencies]);

  const assetTypes: AssetType[] = useMemo(
    () =>
      currenciesByProvider.map(provider => ({
        id: provider.providerId,
        name: provider.providerId,
        ticker: provider.providerId,
      })),
    [currenciesByProvider],
  );

  const getProvider = useCallback(
    (currency: CryptoCurrency | TokenCurrency) =>
      currency &&
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
        ),
      ),
    [currenciesByProvider],
  );

  const isSelectAccountFlow = !!onAccountSelected;

  const isASingleAsset = currencies.length === 1;

  const hasOnlyOneNetwork = networksToDisplay?.length === 1;

  const displayAssetSelection = !selectedAsset && !isASingleAsset;
  const displayNetworkSelection = selectedAsset && !selectedNetwork && !hasOnlyOneNetwork;
  const displayAccountSelection = selectedAsset && selectedNetwork && isSelectAccountFlow;

  const canGoBackToAsset = !isASingleAsset;
  const canGoBackToNetwork = !hasOnlyOneNetwork;

  const changeNavigationDirection = (direction: NavigationDirection) => {
    setNavigationDirection(direction);
  };

  const handleBack = () => {
    if (currentStep === "NETWORK_SELECTION" && canGoBackToAsset) {
      setSelectedAsset(undefined);
      changeNavigationDirection("BACKWARD");
      setCurrentStep("ASSET_SELECTION");
    }
    if (currentStep === "ACCOUNT_SELECTION" && canGoBackToNetwork) {
      setSelectedNetwork(undefined);
      changeNavigationDirection("BACKWARD");
      setCurrentStep("NETWORK_SELECTION");
    }

    if (displayAssetSelection) {
      setBackButtonDisabled(true);
    } else if (displayNetworkSelection) {
      setBackButtonDisabled(!canGoBackToAsset);
    } else if (displayAccountSelection) {
      setBackButtonDisabled(!canGoBackToNetwork);
    }
  };

  useEffect(() => {
    changeNavigationDirection("FORWARD");
  }, [displayAssetSelection, displayNetworkSelection, displayAccountSelection]);

  useEffect(() => {
    if (assetsToDisplay && assetsToDisplay.length === 1) {
      setSelectedAsset(assetsToDisplay[0]);
    }
    if (hasOnlyOneNetwork && selectedAsset) {
      setSelectedNetwork(selectedAsset);
      setCurrentStep("NETWORK_SELECTION");
      //   onAssetSelected?.(selectedAsset);
    }
  }, [assetsToDisplay, hasOnlyOneNetwork, selectedAsset, onAssetSelected]);

  const handleAssetSelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const currentProvider = getProvider(currency);
      setProviders(currentProvider);

      if (!currentProvider) {
        onAssetSelected(currency);
        return;
      }

      const networks = currentProvider.currenciesByNetwork.map(elem =>
        elem.type === "TokenCurrency" ? elem?.parentCurrency?.id : elem.id,
      );

      const hasMultipleNetworks = networks && networks.length > 1;

      if (hasMultipleNetworks) {
        const filteredCryptoCurrencies = networks
          .map(net => findCryptoCurrencyById(net))
          .filter((cur): cur is CryptoCurrency => Boolean(cur));

        setNetworksToDisplay(filteredCryptoCurrencies);
        setBackButtonDisabled(!canGoBackToAsset);
        setCurrentStep("NETWORK_SELECTION");
      } else {
        onAssetSelected(currency);
      }
    },
    [canGoBackToAsset, getProvider, onAssetSelected],
  );

  const handleNetworkSelected = (network: CryptoOrTokenCurrency) => {
    setCurrentStep("ASSET_SELECTION");
  };

  const handleAccountSelected = (account: AccountLike, parentAccount?: Account) => {
    setCurrentStep("ASSET_SELECTION");
  };

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case "ASSET_SELECTION":
        return (
          <AssetSelection
            assetTypes={assetTypes}
            assetsToDisplay={assetsToDisplay}
            sortedCryptoCurrencies={sortedCryptoCurrencies}
            defaultSearchValue={searchedValue}
            setAssetsToDisplay={setAssetsToDisplay}
            setSearchedValue={setSearchedValue}
            onAssetSelected={handleAssetSelected}
          />
        );
      case "NETWORK_SELECTION":
        return (
          <NetworkSelection
            networks={networksToDisplay}
            onNetworkSelected={handleNetworkSelected}
          />
        );
      case "ACCOUNT_SELECTION":
        return <FakeScreenAccountSelection />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header step={currentStep} onBackClick={handleBack} hidden={backButtonDisabled} />
      <Box paddingLeft="16px" paddingRight="16px">
        <AnimatePresence mode="sync">
          <AnimatedScreenWrapper
            key={currentStep}
            screenKey={currentStep}
            direction={navigationDirection}
          >
            {renderStepContent(currentStep)}
          </AnimatedScreenWrapper>
        </AnimatePresence>
      </Box>
    </>
  );
};

const FakeScreenAccountSelection = () => <div>Account Selection</div>;

export default ModularDrawerFlowManager;
