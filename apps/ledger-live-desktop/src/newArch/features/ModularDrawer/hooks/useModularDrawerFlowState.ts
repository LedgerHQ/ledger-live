import { useState, useCallback, useEffect, useMemo } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getProvider } from "../utils/getProvider";
import { CryptoOrTokenCurrency, CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { ModularDrawerStep } from "../types";

type Props = {
  currenciesByProvider: CurrenciesByProviderId[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  networksToDisplay?: CryptoOrTokenCurrency[];
  setNetworksToDisplay: (networks?: CryptoOrTokenCurrency[]) => void;
  currenciesIdsArray: string[];
  goToStep: (nextStep: ModularDrawerStep) => void;
  isSelectAccountFlow?: boolean;
  onAssetSelected?: (asset: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  currentStep: string;
  hasOneNetwork: boolean;
  hasOneCurrency: boolean;
};

export function useModularDrawerFlowState({
  currenciesByProvider,
  assetsToDisplay,
  networksToDisplay,
  setNetworksToDisplay,
  currenciesIdsArray,
  goToStep,
  isSelectAccountFlow,
  onAssetSelected,
  onAccountSelected,
  currentStep,
  hasOneNetwork,
  hasOneCurrency,
}: Props) {
  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency>();
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency>();
  const [searchedValue, setSearchedValue] = useState<string>();
  const [providers, setProviders] = useState<CurrenciesByProviderId>();

  const canGoBackToAsset = !hasOneCurrency;
  const canGoBackToNetwork = !hasOneNetwork;

  const assetTypes = useMemo(
    () =>
      currenciesByProvider.map((provider: CurrenciesByProviderId) => ({
        id: provider.providerId,
        name: provider.providerId,
        ticker: provider.providerId,
      })),
    [currenciesByProvider],
  );

  const findProvider = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => getProvider(currency, currenciesByProvider),
    [currenciesByProvider],
  );

  const goBackToAssetSelection = useCallback(() => {
    setSelectedAsset(undefined);
    setSelectedNetwork(undefined);
    setNetworksToDisplay(undefined);
    goToStep("ASSET_SELECTION");
  }, [goToStep, setNetworksToDisplay]);

  const goBackToNetworkSelection = useCallback(() => {
    setSelectedNetwork(undefined);
    goToStep("NETWORK_SELECTION");
  }, [goToStep]);

  const goToNetworkSelection = useCallback(
    (filteredCryptoCurrencies: CryptoOrTokenCurrency[]) => {
      setNetworksToDisplay(filteredCryptoCurrencies);
      goToStep("NETWORK_SELECTION");
    },
    [goToStep, setNetworksToDisplay],
  );

  const goToAccountSelection = useCallback(
    (asset: CryptoOrTokenCurrency, network: CryptoOrTokenCurrency) => {
      setSelectedAsset(asset);
      setSelectedNetwork(network);
      goToStep("ACCOUNT_SELECTION");
    },
    [goToStep],
  );

  const handleBack = () => {
    if (currentStep === "NETWORK_SELECTION" && canGoBackToAsset) {
      goBackToAssetSelection();
      return;
    }
    if (currentStep === "ACCOUNT_SELECTION") {
      if (hasOneNetwork || !networksToDisplay || networksToDisplay.length <= 1) {
        goBackToAssetSelection();
      } else if (canGoBackToNetwork) {
        goBackToNetworkSelection();
      }
      return;
    }
  };

  const handleNetworkSelected = useCallback(
    (network: CryptoOrTokenCurrency) => {
      if (!providers) return;
      const correspondingCurrency =
        providers.currenciesByNetwork.find(elem => {
          if (elem.type === "TokenCurrency") {
            return elem.parentCurrency?.id === network.id || elem.id === network.id;
          } else if (elem.type === "CryptoCurrency") {
            return elem.id === network.id;
          }
          return false;
        }) || network;

      if (!isSelectAccountFlow) {
        onAssetSelected?.(correspondingCurrency);
      } else {
        goToAccountSelection(correspondingCurrency, network);
      }
    },
    [goToAccountSelection, isSelectAccountFlow, onAssetSelected, providers],
  );

  const handleAssetSelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const currentProvider = findProvider(currency);
      setProviders(currentProvider);

      if (!currentProvider) {
        if (isSelectAccountFlow) {
          goToAccountSelection(currency, currency);
        } else {
          onAssetSelected?.(currency);
        }
        return;
      }

      const networks = currentProvider.currenciesByNetwork
        .filter(currencyByNetwork => currenciesIdsArray.includes(currencyByNetwork.id))
        .map(elem => (elem.type === "TokenCurrency" ? elem.parentCurrency?.id : elem.id));

      const hasMultipleNetworks = networks && networks.length > 1;
      if (hasMultipleNetworks) {
        const filteredCryptoCurrencies = networks
          .map(net => findCryptoCurrencyById(net))
          .filter((cur): cur is CryptoCurrency => Boolean(cur));
        goToNetworkSelection(filteredCryptoCurrencies);
      } else {
        if (isSelectAccountFlow) {
          goToAccountSelection(currency, currency);
        } else {
          onAssetSelected?.(currency);
        }
      }
    },
    [
      currenciesIdsArray,
      findProvider,
      goToAccountSelection,
      goToNetworkSelection,
      isSelectAccountFlow,
      onAssetSelected,
    ],
  );

  const handleAccountSelected = (account: AccountLike, parentAccount?: Account) => {
    onAccountSelected?.(account, parentAccount);
  };

  useEffect(() => {
    if (assetsToDisplay && assetsToDisplay.length === 1) {
      handleAssetSelected(assetsToDisplay[0]);
    }
    if (hasOneNetwork && selectedAsset) {
      setSelectedNetwork(selectedAsset);
      goToStep("NETWORK_SELECTION");
    }
  }, [
    assetsToDisplay,
    hasOneNetwork,
    selectedAsset,
    onAssetSelected,
    handleAssetSelected,
    goToStep,
  ]);

  return {
    selectedAsset,
    setSelectedAsset,
    selectedNetwork,
    setSelectedNetwork,
    searchedValue,
    setSearchedValue,
    providers,
    setProviders,
    assetTypes,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    goToNetworkSelection,
    goToAccountSelection,
    handleBack,
    handleNetworkSelected,
    handleAssetSelected,
    handleAccountSelected,
  };
}
