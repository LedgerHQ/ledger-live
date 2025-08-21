import { useCallback, useEffect, useMemo, useState } from "react";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { ModularDrawerStep } from "../types";

import { getProvider, useProviders } from "./useProviders";
import { useModularDrawerFlowStepManager } from "./useModularDrawerFlowStepManager";
import { useStepNavigation } from "./useStepNavigation";
import { useDeviceNavigation } from "./useDeviceNavigation";
import { useDrawerLifecycle } from "./useDrawerLifecycle";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  getEffectiveCurrency,
  haveOneCommonProvider,
  isCorrespondingCurrency,
} from "@ledgerhq/live-common/modularDrawer/utils/index";
import uniqBy from "lodash/uniqBy";
import compact from "lodash/compact";

type ModularDrawerStateProps = {
  selectedStep?: ModularDrawerStep;
  currencyIds: string[];
  currenciesByProvider: CurrenciesByProviderId[];
  isDrawerOpen?: boolean;
  enableAccountSelection?: boolean;
  onClose?: () => void;
  onAccountSelected?: (account: Account) => void;
  readonly flow: string;
};

/**
 * Custom hook to manage the state of the Modular Drawer.
 * It handles asset and network selection, navigation between steps, and resetting state.
 */
export function useModularDrawerState({
  currencyIds,
  currenciesByProvider,
  isDrawerOpen,
  enableAccountSelection,
  onClose,
  flow,
}: ModularDrawerStateProps) {
  const navigationStepManager = useModularDrawerFlowStepManager();

  useEffect(() => {
    if (isDrawerOpen) {
      setDefaultSearchValue("");
    }
  }, [isDrawerOpen]);

  // State management
  const [asset, setAsset] = useState<CryptoOrTokenCurrency>();
  const [network, setNetwork] = useState<CryptoOrTokenCurrency>();
  const [availableNetworks, setAvailableNetworks] = useState<CryptoOrTokenCurrency[]>([]);
  const [defaultSearchValue, setDefaultSearchValue] = useState("");

  const { providers, setProviders, getNetworksFromProvider } = useProviders();

  // Computed values
  const singleCurrency = useMemo(() => {
    return currencyIds.length === 1 ? findCryptoCurrencyById(currencyIds[0]) : undefined;
  }, [currencyIds]);

  const hasOneCurrency = useMemo(() => {
    return haveOneCommonProvider(currencyIds, currenciesByProvider);
  }, [currencyIds, currenciesByProvider]);

  const clearNetwork = useCallback(() => {
    setNetwork(undefined);
  }, []);

  const reset = useCallback(() => {
    setAsset(undefined);
    clearNetwork();
    setAvailableNetworks([]);
  }, [clearNetwork]);

  // Network selection state
  const selectNetwork = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      setAsset(selectedAsset);
      setNetwork(selectedNetwork);
    },
    [],
  );

  // Navigation handlers
  const { navigateToDeviceWithCurrency } = useDeviceNavigation({
    navigationStepManager,
    enableAccountSelection,
    onClose,
    resetSelection: reset,
    selectNetwork,
  });

  const {
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
    shouldShowBackButton,
    proceedToNextStep,
  } = useStepNavigation({
    navigationStepManager,
    availableNetworksCount: availableNetworks.length,
    hasOneCurrency,
    resetSelection: reset,
    clearNetwork,
    selectNetwork,
    enableAccountSelection,
    navigateToDeviceWithCurrency,
  });

  // Asset selection logic
  const selectAsset = useCallback(
    (selected: CryptoOrTokenCurrency, networks?: CryptoCurrency[]) => {
      setAsset(selected);
      const availableNetworksList = networks ?? [];

      if (availableNetworksList.length > 1) {
        const uniqueNetworks = uniqBy(availableNetworksList, "id");
        setAvailableNetworks(uniqueNetworks);
        navigationStepManager.goToStep(ModularDrawerStep.Network);
      } else if (enableAccountSelection) {
        navigationStepManager.goToStep(ModularDrawerStep.Account);
      } else {
        navigateToDeviceWithCurrency(selected);
      }
    },
    [enableAccountSelection, navigationStepManager, navigateToDeviceWithCurrency],
  );

  // Network navigation logic
  const goToNetwork = useCallback(
    (currency: CryptoOrTokenCurrency, networks: (string | undefined)[]) => {
      const hasMultiple = networks && networks.length > 1;
      const filtered = hasMultiple
        ? compact(networks)
            .map(findCryptoCurrencyById)
            .filter((c): c is CryptoCurrency => Boolean(c))
        : [];

      selectAsset(currency, filtered);
    },
    [selectAsset],
  );

  // Asset and network handlers with provider logic
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
      proceedToNextStep(corresponding, selectedNetwork);
    },
    [proceedToNextStep, providers],
  );

  // Drawer navigation handlers via lifecycle hook
  const { handleBackButton, handleCloseButton } = useDrawerLifecycle({
    flow,
    navigationStepManager,
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
    onClose,
    resetSelection: reset,
  });

  // Auto-handle single currency when drawer opens
  useEffect(() => {
    if (isDrawerOpen && singleCurrency && !asset && !network) {
      handleAsset(singleCurrency);
    }
  }, [isDrawerOpen, singleCurrency, asset, network, handleAsset]);

  const onAddNewAccount = useCallback(() => {
    if (!asset) return;
    navigateToDeviceWithCurrency(asset);
  }, [asset, navigateToDeviceWithCurrency]);

  return {
    asset,
    network,
    availableNetworks,
    hasOneCurrency,
    navigationStepManager,
    shouldShowBackButton,
    defaultSearchValue,
    setDefaultSearchValue,
    onAddNewAccount,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
  };
}
