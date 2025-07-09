import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import uniqWith from "lodash/uniqWith";
import { useCallback, useState } from "react";
import { getProvider, useProviders } from "./useProviders";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ModularDrawerStep } from "../types";
/**
 * Props for useModularDrawerState hook.
 */
type ModularDrawerStateProps = {
  goToStep?: (step: ModularDrawerStep) => void;
  currencyIds: string[];
  currenciesByProvider: CurrenciesByProviderId[];
};

/**
 * Custom hook to manage asset and network selection state for the modular drawer.
 */
export function useModularDrawerState({
  goToStep,
  currencyIds,
  currenciesByProvider,
}: ModularDrawerStateProps) {
  const [asset, setAsset] = useState<CryptoOrTokenCurrency | null>(null);
  const [network, setNetwork] = useState<CryptoOrTokenCurrency | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<CryptoOrTokenCurrency[]>([]);
  const { providers, setProviders, getNetworksFromProvider } = useProviders();

  /**
   * Select an asset and handle navigation depending on available networks.
   */
  const selectAsset = useCallback(
    (selected: CryptoOrTokenCurrency, networks?: CryptoCurrency[]) => {
      setAsset(selected);
      if ((networks ?? []).length > 1) {
        setAvailableNetworks(uniqWith(networks ?? [], (a, b) => a.id === b.id));
        goToStep?.(ModularDrawerStep.Network);
      } else {
        goToStep?.(ModularDrawerStep.Account);
      }
    },
    [goToStep],
  );

  /**
   * Select a network and go to the account step.
   */
  const selectNetwork = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      setAsset(selectedAsset);
      setNetwork(selectedNetwork);
      goToStep?.(ModularDrawerStep.Account);
    },
    [goToStep],
  );

  /**
   * Reset all selection state.
   */
  const reset = useCallback(() => {
    setAsset(null);
    setNetwork(null);
    setAvailableNetworks([]);
  }, []);

  /**
   * Go back to asset selection step.
   */
  const backToAsset = useCallback(() => {
    reset();
    goToStep?.(ModularDrawerStep.Asset);
  }, [goToStep, reset]);

  /**
   * Go back to network selection step.
   */
  const backToNetwork = useCallback(() => {
    setNetwork(null);
    goToStep?.(ModularDrawerStep.Network);
  }, [goToStep]);

  /**
   * Go back to previous step based on current step.
   */
  const handleBack = useCallback(
    (step: ModularDrawerStep) => {
      switch (step) {
        case ModularDrawerStep.Network:
          backToAsset();
          break;
        case ModularDrawerStep.Account:
          availableNetworks.length > 1 ? backToNetwork() : backToAsset();
          break;
        default:
          break;
      }
    },
    [backToAsset, backToNetwork, availableNetworks.length],
  );

  /**
   * Go to network selection step for a given asset.
   */
  const goToNetwork = useCallback(
    (currency: CryptoOrTokenCurrency, networks: (string | undefined)[]) => {
      const hasMultiple = networks && networks.length > 1;
      const filtered = hasMultiple
        ? networks
            .filter((n): n is string => Boolean(n))
            .map(n => findCryptoCurrencyById(n))
            .filter((c): c is CryptoCurrency => Boolean(c))
        : [];
      selectAsset(currency, filtered);
    },
    [selectAsset],
  );

  /**
   * Go to account selection step for a given asset and network.
   */
  const goToAccount = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      selectNetwork(selectedAsset, selectedNetwork);
    },
    [selectNetwork],
  );

  /**
   * Handle asset selection from UI.
   */
  const handleAsset = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const provider = getProvider(currency, currenciesByProvider);
      setProviders(provider);
      if (!provider) {
        selectAsset(currency);
        return;
      }
      const networks = getNetworksFromProvider(provider, currencyIds);
      goToNetwork(currency, networks);
    },
    [
      currenciesByProvider,
      setProviders,
      getNetworksFromProvider,
      currencyIds,
      goToNetwork,
      selectAsset,
    ],
  );

  /**
   * Handle network selection from UI.
   */
  const handleNetwork = useCallback(
    (selectedNetwork: CryptoOrTokenCurrency) => {
      if (!providers) return;
      const corresponding =
        providers.currenciesByNetwork.find(c => isCorrespondingCurrency(c, selectedNetwork)) ??
        selectedNetwork;
      goToAccount(corresponding, selectedNetwork);
    },
    [goToAccount, providers],
  );

  return {
    asset,
    network,
    availableNetworks,
    selectAsset,
    selectNetwork,
    reset,
    backToAsset,
    backToNetwork,
    handleBack,
    handleAsset,
    handleNetwork,
  };
}

/**
 * Returns true if the given element corresponds to the network.
 */
function isCorrespondingCurrency(
  elem: CryptoOrTokenCurrency,
  network: CryptoOrTokenCurrency,
): boolean {
  if (elem.type === "TokenCurrency") {
    return elem.parentCurrency?.id === network.id || elem.id === network.id;
  }
  if (elem.type === "CryptoCurrency") {
    return elem.id === network.id;
  }
  return false;
}
