import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import uniqWith from "lodash/uniqWith";
import { useCallback, useState } from "react";
import { getProvider, useProviders } from "./useProviders";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ModularDrawerStep } from "../types";
import {
  getEffectiveCurrency,
  isCorrespondingCurrency,
} from "@ledgerhq/live-common/modularDrawer/utils/index";

type ModularDrawerStateProps = {
  goToStep?: (step: ModularDrawerStep) => void;
  currencyIds: string[];
  currenciesByProvider: CurrenciesByProviderId[];
};

/**
 * Custom hook to manage the state of the Modular Drawer.
 * It handles asset and network selection, navigation between steps, and resetting state.
 *
 * @param {ModularDrawerStateProps} props - The properties for the hook.
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

  const selectNetwork = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      setAsset(selectedAsset);
      setNetwork(selectedNetwork);
      goToStep?.(ModularDrawerStep.Account);
    },
    [goToStep],
  );

  const reset = useCallback(() => {
    setAsset(null);
    setNetwork(null);
    setAvailableNetworks([]);
  }, []);

  const backToAsset = useCallback(() => {
    reset();
    goToStep?.(ModularDrawerStep.Asset);
  }, [goToStep, reset]);

  const backToNetwork = useCallback(() => {
    setNetwork(null);
    goToStep?.(ModularDrawerStep.Network);
  }, [goToStep]);

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

  const goToAccount = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      selectNetwork(selectedAsset, selectedNetwork);
    },
    [selectNetwork],
  );

  const handleAsset = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const provider = getProvider(currency, currenciesByProvider);
      setProviders(provider);
      if (!provider) {
        selectAsset(currency);
        return;
      }
      const networks = getNetworksFromProvider(provider, currencyIds);
      const effectiveCurrency = getEffectiveCurrency(currency, provider, currencyIds);
      goToNetwork(effectiveCurrency, networks);
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
