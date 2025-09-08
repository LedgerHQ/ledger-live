import { useState, useCallback, useEffect } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getProvider } from "../utils/getProvider";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
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
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { useSelector } from "react-redux";
import { modularDrawerStateSelector } from "~/renderer/reducers/modularDrawer";

type Props = {
  currenciesByProvider: CurrenciesByProviderId[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  setNetworksToDisplay: (networks?: CryptoOrTokenCurrency[]) => void;
  currencyIds: string[];
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
  currencyIds,
  goToStep,
  isSelectAccountFlow,
  onAssetSelected,
  onAccountSelected,
  hasOneCurrency,
  flow,
}: Props) {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const { searchedValue } = useSelector(modularDrawerStateSelector);

  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency>();
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency>();
  const [providers, setProviders] = useState<CurrenciesByProviderId>();
  const [hasOneInitialCurrency, setHasOneInitialCurrency] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    if (hasOneInitialCurrency === undefined && hasOneCurrency && searchedValue === undefined) {
      setHasOneInitialCurrency(true);
    }
  }, [hasOneInitialCurrency, hasOneCurrency, searchedValue]);

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
        .filter(currencyByNetwork => currencyIds.includes(currencyByNetwork.id))
        .map(elem => elem.id);
    },
    [currencyIds],
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
    (currency: CryptoOrTokenCurrency, provider: CurrenciesByProviderId, networks: string[]) => {
      const effectiveCurrency = getEffectiveCurrency(currency, provider, currencyIds);
      const filteredCryptoCurrencies = networks
        .filter((net): net is string => Boolean(net))
        .map(net => findCryptoCurrencyById(net) || findTokenById(net))
        .filter((c): c is CryptoOrTokenCurrency => Boolean(c));

      goToNetworkSelection(effectiveCurrency, filteredCryptoCurrencies);
    },
    [currencyIds, goToNetworkSelection],
  );

  const handleSingleNetwork = useCallback(
    (currency: CryptoOrTokenCurrency, provider: CurrenciesByProviderId) => {
      if (isSelectAccountFlow) {
        const effectiveCurrency = getEffectiveCurrency(currency, provider, currencyIds);
        goToAccountSelection(effectiveCurrency, effectiveCurrency);
      } else {
        onAssetSelected?.(currency);
      }
    },
    [isSelectAccountFlow, currencyIds, goToAccountSelection, onAssetSelected],
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
    if (hasOneInitialCurrency && !selectedAsset) {
      const currencyIdToFind = currencyIds[0];
      const currency = getTokenOrCryptoCurrencyById(currencyIdToFind);

      if (currency) {
        handleAssetSelected(currency);
      }
    }
  }, [
    sortedCryptoCurrencies,
    currencyIds.length,
    goToStep,
    handleAssetSelected,
    hasOneCurrency,
    selectedAsset,
    currencyIds,
    searchedValue,
    hasOneInitialCurrency,
  ]);

  return {
    selectedAsset,
    setSelectedAsset,
    selectedNetwork,
    setSelectedNetwork,
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
