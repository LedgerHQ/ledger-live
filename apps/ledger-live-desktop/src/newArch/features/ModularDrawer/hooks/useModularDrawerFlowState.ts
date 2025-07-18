import { useState, useCallback, useEffect } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getProvider } from "../utils/getProvider";
import { CryptoOrTokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { ModularDrawerStep } from "../types";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../analytics/modularDrawer.types";
import { getTokenOrCryptoCurrencyById } from "@ledgerhq/live-common/deposit/helper";
import uniqWith from "lodash/uniqWith";

import {
  getEffectiveCurrency,
  isCorrespondingCurrency,
} from "@ledgerhq/live-common/modularDrawer/utils/index";

type Props = {
  currenciesByProvider: CurrenciesByProviderId[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  setNetworksToDisplay: (networks?: CryptoOrTokenCurrency[]) => void;
  currenciesIdsArray: string[];
  goToStep: (nextStep: ModularDrawerStep) => void;
  isSelectAccountFlow?: boolean;
  onAssetSelected?: (asset: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  hasOneCurrency: boolean;
  flow: string;
};

export function useModularDrawerFlowState({
  currenciesByProvider,
  sortedCryptoCurrencies,
  setNetworksToDisplay,
  currenciesIdsArray,
  goToStep,
  isSelectAccountFlow,
  onAssetSelected,
  onAccountSelected,
  hasOneCurrency,
  flow,
}: Props) {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency>();
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency>();
  const [searchedValue, setSearchedValue] = useState<string>();
  const [providers, setProviders] = useState<CurrenciesByProviderId>();

  const goBackToAssetSelection = useCallback(() => {
    setSelectedAsset(undefined);
    setSelectedNetwork(undefined);
    setNetworksToDisplay(undefined);
    trackModularDrawerEvent("button_clicked", {
      button: "Back",
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
      flow: flow,
    });
    goToStep("ASSET_SELECTION");
  }, [flow, goToStep, setNetworksToDisplay, trackModularDrawerEvent]);

  const goBackToNetworkSelection = useCallback(() => {
    setSelectedNetwork(undefined);
    goToStep("NETWORK_SELECTION");
  }, [goToStep]);

  const goToNetworkSelection = useCallback(
    (asset: CryptoOrTokenCurrency, filteredCryptoCurrencies: CryptoOrTokenCurrency[]) => {
      setSelectedAsset(asset);
      setNetworksToDisplay(uniqWith(filteredCryptoCurrencies, (a, b) => a.id === b.id));
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
        providers.currenciesByNetwork.find(elem => isCorrespondingCurrency(elem, network)) ??
        network;

      if (!isSelectAccountFlow) {
        onAssetSelected?.(correspondingCurrency);
      } else {
        goToAccountSelection(correspondingCurrency, network);
      }
    },
    [goToAccountSelection, isSelectAccountFlow, onAssetSelected, providers],
  );

  const getNetworksFromProvider = useCallback(
    (provider: CurrenciesByProviderId) => {
      return provider.currenciesByNetwork
        .filter(currencyByNetwork => currenciesIdsArray.includes(currencyByNetwork.id))
        .map(elem => (elem.type === "TokenCurrency" ? elem.parentCurrency?.id : elem.id));
    },
    [currenciesIdsArray],
  );

  const handleNoProvider = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      if (isSelectAccountFlow) {
        goToAccountSelection(currency, currency);
      } else {
        onAssetSelected?.(currency);
      }
    },
    [isSelectAccountFlow, goToAccountSelection, onAssetSelected],
  );

  const handleMultipleNetworks = useCallback(
    (
      currency: CryptoOrTokenCurrency,
      provider: CurrenciesByProviderId,
      networks: (string | undefined)[],
    ) => {
      const effectiveCurrency = getEffectiveCurrency(currency, provider, currenciesIdsArray);
      const filteredCryptoCurrencies = networks
        .filter((net): net is string => Boolean(net))
        .map(net => findCryptoCurrencyById(net))
        .filter((cur): cur is CryptoCurrency => Boolean(cur));

      goToNetworkSelection(effectiveCurrency, filteredCryptoCurrencies);
    },
    [currenciesIdsArray, goToNetworkSelection],
  );

  const handleSingleNetwork = useCallback(
    (currency: CryptoOrTokenCurrency, provider: CurrenciesByProviderId) => {
      if (isSelectAccountFlow) {
        const effectiveCurrency = getEffectiveCurrency(currency, provider, currenciesIdsArray);
        goToAccountSelection(effectiveCurrency, effectiveCurrency);
      } else {
        onAssetSelected?.(currency);
      }
    },
    [isSelectAccountFlow, currenciesIdsArray, goToAccountSelection, onAssetSelected],
  );

  const handleAssetSelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const currentProvider = getProvider(currency, currenciesByProvider);
      setProviders(currentProvider);

      if (!currentProvider) {
        handleNoProvider(currency);
        return;
      }

      const networks = getNetworksFromProvider(currentProvider);
      const hasMultipleNetworks = networks && networks.length > 1;

      if (hasMultipleNetworks) {
        handleMultipleNetworks(currency, currentProvider, networks);
      } else {
        handleSingleNetwork(currency, currentProvider);
      }
    },
    [
      currenciesByProvider,
      handleNoProvider,
      getNetworksFromProvider,
      handleMultipleNetworks,
      handleSingleNetwork,
    ],
  );

  const handleAccountSelected = (account: AccountLike, parentAccount?: Account) => {
    onAccountSelected?.(account, parentAccount);
  };

  useEffect(() => {
    if (hasOneCurrency && !selectedAsset) {
      const currencyIdToFind = currenciesIdsArray[0];
      const currency = getTokenOrCryptoCurrencyById(currencyIdToFind);

      if (currency) {
        handleAssetSelected(currency);
      }
    }
  }, [
    sortedCryptoCurrencies,
    currenciesIdsArray.length,
    goToStep,
    handleAssetSelected,
    hasOneCurrency,
    selectedAsset,
    currenciesIdsArray,
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
