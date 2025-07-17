import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import uniqWith from "lodash/uniqWith";
import { useCallback, useEffect, useState } from "react";
import { getProvider, useProviders } from "./useProviders";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ModularDrawerStep } from "../types";
import {
  getEffectiveCurrency,
  isCorrespondingCurrency,
} from "@ledgerhq/live-common/modularDrawer/utils/index";

import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import { useNavigation } from "@react-navigation/core";
import { AssetSelectionNavigationProps } from "../../AssetSelection/types";

type ModularDrawerStateProps = {
  goToStep?: (step: ModularDrawerStep) => void;
  currencyIds: string[];
  currenciesByProvider: CurrenciesByProviderId[];
  isDrawerOpen?: boolean;
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
  isDrawerOpen,
}: ModularDrawerStateProps) {
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();

  //To be handled incr2
  const isAddAccountFlow = true;

  const [asset, setAsset] = useState<CryptoOrTokenCurrency | null>(null);
  const [network, setNetwork] = useState<CryptoOrTokenCurrency | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<CryptoOrTokenCurrency[]>([]);
  const { providers, setProviders, getNetworksFromProvider } = useProviders();

  const navigateToDevice = useCallback(
    (selectedAsset: CryptoCurrency, createTokenAccount?: boolean) => {
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
        },
      });
    },
    [navigation],
  );

  const processNetworkSelection = useCallback(
    (selectedCurrency: CryptoOrTokenCurrency) => {
      const isToken = selectedCurrency.type === "TokenCurrency";
      const asset = isToken ? selectedCurrency.parentCurrency : selectedCurrency;
      const createTokenAccount = isToken;

      navigateToDevice(asset, createTokenAccount);
    },
    [navigateToDevice],
  );

  const selectAsset = useCallback(
    (selected: CryptoOrTokenCurrency, networks?: CryptoCurrency[]) => {
      setAsset(selected);

      const availableNetworksList = networks ?? [];

      if (availableNetworksList.length > 1) {
        const uniqueNetworks = uniqWith(availableNetworksList, (a, b) => a.id === b.id);
        setAvailableNetworks(uniqueNetworks);
        goToStep?.(ModularDrawerStep.Network);
      } else {
        if (isAddAccountFlow) {
          processNetworkSelection(selected);
        } else {
          goToStep?.(ModularDrawerStep.Account);
        }
      }
    },
    [goToStep, isAddAccountFlow, processNetworkSelection],
  );

  const selectNetwork = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      setAsset(selectedAsset);
      setNetwork(selectedNetwork);
    },
    [],
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

      if (isAddAccountFlow) {
        processNetworkSelection(selectedAsset);
      } else {
        // TODO in incr2
        goToStep?.(ModularDrawerStep.Account);
      }
    },
    [goToStep, isAddAccountFlow, processNetworkSelection, selectNetwork],
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

  const handleSingleCurrencyFlow = useCallback(
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

  useEffect(() => {
    if (isDrawerOpen && currencyIds.length === 1 && !asset) {
      const currency = findCryptoCurrencyById(currencyIds[0]);
      if (currency) {
        handleSingleCurrencyFlow(currency);
      }
    }
  }, [asset, currencyIds, handleSingleCurrencyFlow, isDrawerOpen]);

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
    handleSingleCurrencyFlow,
  };
}
