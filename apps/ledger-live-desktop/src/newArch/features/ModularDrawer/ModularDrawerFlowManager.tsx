import React, { useMemo, useState } from "react";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { AnimatePresence } from "framer-motion";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { ModularDrawerStep } from "./types";
import AssetSelection from "./screens/AssetSelection";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook";
import { NetworkSelection } from "./screens/NetworkSelection";
import { Header } from "./components/Header";
import { AccountSelection } from "./screens/AccountSelection";
import { LoadingBasedGroupedCurrencies } from "@ledgerhq/live-common/deposit/type";

import { useModularDrawerNavigation } from "./hooks/useModularDrawerNavigation";
import { useAssetSelection } from "./hooks/useAssetSelection";
import { useModularDrawerFlowState } from "./hooks/useModularDrawerFlowState";

type Props = {
  currencies: CryptoOrTokenCurrency[];
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  accounts$?: Observable<WalletAPIAccount[]>;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
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

  const { result } = useGroupedCurrenciesByProvider(true) as LoadingBasedGroupedCurrencies;
  const { currenciesByProvider, sortedCryptoCurrencies } = result;

  const {
    assetsToDisplay,
    setAssetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
  } = useAssetSelection(currencies, sortedCryptoCurrencies);

  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();

  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();
  const isSelectAccountFlow = !!onAccountSelected;
  const hasOneCurrency = currencies.length === 1;
  const hasOneNetwork = networksToDisplay?.length === 1;

  const {
    selectedAsset,
    selectedNetwork,
    searchedValue,
    assetTypes,
    setSearchedValue,
    handleBack,
    handleNetworkSelected,
    handleAssetSelected,
    handleAccountSelected,
  } = useModularDrawerFlowState({
    currenciesByProvider,
    assetsToDisplay,
    networksToDisplay,
    currenciesIdsArray,
    isSelectAccountFlow,
    currentStep,
    hasOneNetwork,
    hasOneCurrency,
    setNetworksToDisplay,
    goToStep,
    onAssetSelected,
    onAccountSelected,
  });

  const backButtonDisabled = useMemo(() => {
    if (hasOneCurrency) return true;
    if (currentStep === "NETWORK_SELECTION") return hasOneCurrency;
    if (currentStep === "ACCOUNT_SELECTION") {
      return hasOneCurrency && hasOneNetwork && !(selectedAsset && selectedNetwork);
    }
    return true;
  }, [hasOneCurrency, currentStep, hasOneNetwork, selectedAsset, selectedNetwork]);

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case "ASSET_SELECTION":
        return (
          <AssetSelection
            assetTypes={assetTypes}
            assetsToDisplay={assetsToDisplay}
            sortedCryptoCurrencies={filteredSortedCryptoCurrencies}
            defaultSearchValue={searchedValue}
            assetsConfiguration={assetConfiguration}
            setAssetsToDisplay={setAssetsToDisplay}
            setSearchedValue={setSearchedValue}
            onAssetSelected={handleAssetSelected}
          />
        );
      case "NETWORK_SELECTION":
        return (
          <NetworkSelection
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
          />
        );
      case "ACCOUNT_SELECTION":
        if (selectedAsset && selectedNetwork) {
          return (
            <AccountSelection
              asset={selectedAsset}
              accounts$={accounts$}
              onAccountSelected={handleAccountSelected}
              source="Accounts"
              flow="Modular Account Flow"
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
      <Header step={currentStep} onBackClick={handleBack} hidden={backButtonDisabled} />
      <AnimatePresence mode="sync">
        <AnimatedScreenWrapper
          key={currentStep}
          screenKey={currentStep}
          direction={navigationDirection}
        >
          {renderStepContent(currentStep)}
        </AnimatedScreenWrapper>
      </AnimatePresence>
    </>
  );
};

export default ModularDrawerFlowManager;
