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
import { useModularDrawer } from "./useModularDrawer";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import { useNavigation } from "@react-navigation/core";
import { AssetSelectionNavigationProps } from "../../AssetSelection/types";

type ModularDrawerStateProps = {
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
  currencyIds,
  currenciesByProvider,
}: ModularDrawerStateProps) {
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();

  //To be handled incr2
  const isAddAccountFlow = true;

  const {
    selectedAsset,
    selectedNetwork,
    currentStep,
    setSelectedAsset,
    setSelectedNetwork,
    resetState,
    goToStep,
    closeDrawer,
  } = useModularDrawer();

  const [availableNetworks, setAvailableNetworks] = useState<CryptoOrTokenCurrency[]>([]);
  const { providers, setProviders, getNetworksFromProvider } = useProviders();

  const navigateToDevice = useCallback(
    (
      selectedAsset: CryptoCurrency,
      selectedNetwork?: CryptoOrTokenCurrency,
      createTokenAccount?: boolean,
    ) => {
      closeDrawer();
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
          modularDrawer: {
            isFromModularDrawer: true,
            asset: selectedAsset,
            network: selectedNetwork ?? null,
            step: currentStep,
          },
        },
      });
    },
    [closeDrawer, currentStep, navigation],
  );

  const processNetworkSelection = useCallback(
    (selectedCurrency: CryptoOrTokenCurrency, selectedNetwork?: CryptoOrTokenCurrency) => {
      if (selectedCurrency.type === "TokenCurrency") {
        navigateToDevice(selectedCurrency.parentCurrency, selectedNetwork, true);
      } else {
        navigateToDevice(selectedCurrency, selectedNetwork, false);
      }
    },
    [navigateToDevice],
  );

  const selectAsset = useCallback(
    (selected: CryptoOrTokenCurrency, networks?: CryptoCurrency[]) => {
      setSelectedAsset(selected);
      if ((networks ?? []).length > 1) {
        setAvailableNetworks(uniqWith(networks ?? [], (a, b) => a.id === b.id));
        goToStep?.(ModularDrawerStep.Network);
      } else {
        if (isAddAccountFlow) {
          processNetworkSelection(selected);
        } else {
          goToStep?.(ModularDrawerStep.Account);
        }
      }
    },
    [goToStep, isAddAccountFlow, processNetworkSelection, setSelectedAsset],
  );

  const selectNetwork = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      setSelectedAsset(selectedAsset);
      setSelectedNetwork(selectedNetwork);
    },
    [setSelectedAsset, setSelectedNetwork],
  );

  const backToAsset = useCallback(() => {
    resetState();
    goToStep?.(ModularDrawerStep.Asset);
  }, [goToStep, resetState]);

  const backToNetwork = useCallback(() => {
    setSelectedNetwork(null);
    goToStep?.(ModularDrawerStep.Network);
  }, [goToStep, setSelectedNetwork]);

  const handleBack = useCallback(() => {
    const hasMultipleNetwork = availableNetworks.length > 1;
    switch (currentStep) {
      case ModularDrawerStep.Network:
        backToAsset();
        break;
      case ModularDrawerStep.Account:
        if (hasMultipleNetwork) {
          backToNetwork();
        } else {
          backToAsset();
        }
        break;
    }
  }, [availableNetworks, currentStep, backToAsset, backToNetwork]);

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
        processNetworkSelection(selectedAsset, selectedNetwork);
      } else {
        // TODO in incr2
        goToStep?.(ModularDrawerStep.Account);
      }
    },
    [selectNetwork, isAddAccountFlow, processNetworkSelection, goToStep],
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
    selectedAsset,
    selectedNetwork,
    availableNetworks,
    currentStep,
    resetState,
    selectAsset,
    selectNetwork,
    backToAsset,
    backToNetwork,
    handleBack,
    handleAsset,
    handleNetwork,
  };
}
