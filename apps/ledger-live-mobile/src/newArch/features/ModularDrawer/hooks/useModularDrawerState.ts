import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import uniqWith from "lodash/uniqWith";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { getProvider, useProviders } from "./useProviders";
import { useModularDrawerFlowStepManager } from "./useModularDrawerFlowStepManager";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import {
  getEffectiveCurrency,
  haveOneCommonProvider,
  isCorrespondingCurrency,
} from "@ledgerhq/live-common/modularDrawer/utils/index";

import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import { AssetSelectionNavigationProps } from "../../AssetSelection/types";
import { ModularDrawerStep } from "../types";
import {
  getCurrentPageName,
  useModularDrawerAnalytics,
} from "../analytics/useModularDrawerAnalytics";
import { EVENTS_NAME } from "../analytics";
import { Keyboard } from "react-native";

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
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();
  const navigationStepManager = useModularDrawerFlowStepManager();

  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const hasClosedRef = useRef(false);

  useEffect(() => {
    if (isDrawerOpen) {
      setDefaultSearchValue("");
      hasClosedRef.current = false;
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

  const canGoBackToAsset = !hasOneCurrency;
  const canGoBackToNetwork = availableNetworks.length > 1;

  // Reset function - defined early to avoid hoisting issues
  const reset = useCallback(() => {
    setAsset(undefined);
    setNetwork(undefined);
    setAvailableNetworks([]);
  }, []);

  // Navigation handlers
  const navigateToDevice = useCallback(
    (selectedAsset: CryptoCurrency, createTokenAccount?: boolean) => {
      onClose?.();
      // Reset state immediately when navigating to device selection
      reset();
      navigationStepManager.reset();
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
        },
      });
    },
    [navigation, onClose, reset, navigationStepManager],
  );

  const navigateToDeviceWithCurrency = useCallback(
    (selectedCurrency: CryptoOrTokenCurrency) => {
      const isToken = selectedCurrency.type === "TokenCurrency";
      const asset = isToken ? selectedCurrency.parentCurrency : selectedCurrency;
      const createTokenAccount = isToken;
      navigateToDevice(asset, createTokenAccount);
    },
    [navigateToDevice],
  );

  // Asset selection logic
  const selectAsset = useCallback(
    (selected: CryptoOrTokenCurrency, networks?: CryptoCurrency[]) => {
      setAsset(selected);
      const availableNetworksList = networks ?? [];

      if (availableNetworksList.length > 1) {
        const uniqueNetworks = uniqWith(availableNetworksList, (a, b) => a.id === b.id);
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

  const selectNetwork = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      setAsset(selectedAsset);
      setNetwork(selectedNetwork);
    },
    [],
  );

  // Navigation step handlers

  const backToAsset = useCallback(() => {
    reset();
    navigationStepManager.goToStep(ModularDrawerStep.Asset);
  }, [navigationStepManager, reset]);

  const backToNetwork = useCallback(() => {
    setNetwork(undefined);
    navigationStepManager.goToStep(ModularDrawerStep.Network);
  }, [navigationStepManager]);

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

  // Network navigation logic
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

  const proceedToNextStep = useCallback(
    (selectedAsset: CryptoOrTokenCurrency, selectedNetwork: CryptoOrTokenCurrency) => {
      selectNetwork(selectedAsset, selectedNetwork);

      if (enableAccountSelection) {
        navigationStepManager.goToStep(ModularDrawerStep.Account);
      } else {
        navigateToDeviceWithCurrency(selectedAsset);
      }
    },
    [enableAccountSelection, navigationStepManager, navigateToDeviceWithCurrency, selectNetwork],
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

  const handleSingleCurrency = useCallback(
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

  // Drawer navigation handlers
  const handleBackButton = useCallback(() => {
    const currentStep = navigationStepManager.currentStep;

    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "modularDrawer_backButton",
      flow,
      page: getCurrentPageName(navigationStepManager.currentStep),
    });

    switch (currentStep) {
      case ModularDrawerStep.Network:
        if (canGoBackToAsset) {
          return backToAsset();
        }
        return undefined;
      case ModularDrawerStep.Account:
        if (canGoBackToNetwork) {
          return backToNetwork();
        } else if (canGoBackToAsset) {
          return backToAsset();
        }
        return undefined;
      default:
        return undefined;
    }
  }, [
    navigationStepManager.currentStep,
    trackModularDrawerEvent,
    flow,
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
  ]);

  const handleCloseButton = useCallback(() => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    // this ensure the keyboard is dismissed before closing the drawer to avoid weird behavior
    handleKeyboardDismiss();
    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "Close",
      flow,
      page: getCurrentPageName(navigationStepManager.currentStep),
    });

    onClose?.();

    reset();
    navigationStepManager.reset();
  }, [trackModularDrawerEvent, flow, navigationStepManager, onClose, reset]);

  // Back button visibility logic
  const shouldShowBackButton = useMemo(() => {
    const currentStep = navigationStepManager.currentStep;

    switch (currentStep) {
      case ModularDrawerStep.Network:
        return canGoBackToAsset;
      case ModularDrawerStep.Account:
        return canGoBackToNetwork || canGoBackToAsset;
      default:
        return false;
    }
  }, [navigationStepManager.currentStep, canGoBackToAsset, canGoBackToNetwork]);

  // Auto-handle single currency when drawer opens
  useEffect(() => {
    // Only handle single currency when drawer opens and we have a single currency
    // and no asset is currently selected
    if (isDrawerOpen && singleCurrency && !asset && !network) {
      handleSingleCurrency(singleCurrency);
    }
  }, [isDrawerOpen, singleCurrency, asset, network, handleSingleCurrency]);

  /**
   * Handlers for the back & close button in the drawer.
   */
  const handleKeyboardDismiss = () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
  };

  const onAddNewAccount = useCallback(() => {
    navigateToDevice(asset as CryptoCurrency);
  }, [asset, navigateToDevice]);

  return {
    // State
    asset,
    network,
    availableNetworks,
    hasOneCurrency,

    // Navigation
    navigationStepManager,
    canGoBackToAsset,
    canGoBackToNetwork,

    // Event handlers
    handleBackButton,
    handleCloseButton,
    shouldShowBackButton,

    // Asset/Network handlers
    handleAsset,
    handleNetwork,
    handleSingleCurrencyFlow: handleSingleCurrency,

    // Internal handlers (exposed for compatibility)
    selectAsset,
    selectNetwork,
    reset,
    backToAsset,
    backToNetwork,
    handleBack,

    defaultSearchValue,
    setDefaultSearchValue,
    onAddNewAccount,
  };
}
