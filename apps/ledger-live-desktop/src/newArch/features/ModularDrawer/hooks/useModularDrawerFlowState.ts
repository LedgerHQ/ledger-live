import { useState, useCallback, useEffect } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getProvider } from "../utils/getProvider";
import { CryptoOrTokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { ModularDrawerStep } from "../types";

type Props = {
  currenciesByProvider: CurrenciesByProviderId[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  setNetworksToDisplay: (networks?: CryptoOrTokenCurrency[]) => void;
  currenciesIdsArray: string[];
  goToStep: (nextStep: ModularDrawerStep) => void;
  isSelectAccountFlow?: boolean;
  onAssetSelected?: (asset: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  hasOneNetwork: boolean;
};

export function useModularDrawerFlowState({
  currenciesByProvider,
  assetsToDisplay,
  setNetworksToDisplay,
  currenciesIdsArray,
  goToStep,
  isSelectAccountFlow,
  onAssetSelected,
  onAccountSelected,
  hasOneNetwork,
}: Props) {
  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency>();
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency>();
  const [searchedValue, setSearchedValue] = useState<string>();
  const [providers, setProviders] = useState<CurrenciesByProviderId>();

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
      const currentProvider = getProvider(currency, currenciesByProvider);
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
      currenciesByProvider,
      currenciesIdsArray,
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
    goBackToAssetSelection,
    goBackToNetworkSelection,
    goToNetworkSelection,
    goToAccountSelection,
    handleNetworkSelected,
    handleAssetSelected,
    handleAccountSelected,
  };
}
