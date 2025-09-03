import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { ModularDrawerStep } from "../types";

import { useModularDrawerFlowStepManager } from "./useModularDrawerFlowStepManager";
import { useStepNavigation } from "./useStepNavigation";
import { useDeviceNavigation } from "./useDeviceNavigation";
import { useDrawerLifecycle } from "./useDrawerLifecycle";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { UseAssetsData } from "./useAssetsFromDada";

type ModularDrawerStateProps = {
  assetsSorted: UseAssetsData;
  selectedStep?: ModularDrawerStep;
  currencyIds: string[];
  isDrawerOpen?: boolean;
  enableAccountSelection?: boolean;
  onClose?: () => void;
  onAccountSelected?: (account: Account) => void;
  readonly flow: string;
};

function getNetworksForAsset(assetsSorted: UseAssetsData, assetId: string) {
  return assetsSorted?.find(elem => elem.asset.id === assetId)?.networks ?? [];
}

/**
 * Custom hook to manage the state of the Modular Drawer.
 * It handles asset and network selection, navigation between steps, and resetting state.
 */
export function useModularDrawerState({
  assetsSorted,
  currencyIds,
  isDrawerOpen,
  enableAccountSelection,
  onClose,
  flow,
}: ModularDrawerStateProps) {
  const navigationStepManager = useModularDrawerFlowStepManager();

  // State management
  const [asset, setAsset] = useState<CryptoOrTokenCurrency>();
  const [network, setNetwork] = useState<CryptoOrTokenCurrency>();
  const [availableNetworks, setAvailableNetworks] = useState<CryptoOrTokenCurrency[]>([]);
  const autoSelectRef = useRef(false);

  // Computed values
  const singleCurrency = useMemo(() => {
    return currencyIds.length === 1 ? findCryptoCurrencyById(currencyIds[0]) : undefined;
  }, [currencyIds]);

  // To adapt
  const hasOneCurrency = useMemo(() => assetsSorted?.length === 1, [assetsSorted?.length]);

  const clearNetwork = useCallback(() => {
    setNetwork(undefined);
  }, []);

  const reset = useCallback(() => {
    setAsset(undefined);
    clearNetwork();
    setAvailableNetworks([]);
  }, [clearNetwork]);

  // Network selection state
  const selectNetwork = useCallback((selectedNetwork: CryptoOrTokenCurrency) => {
    setNetwork(selectedNetwork);
  }, []);

  // Navigation handlers
  const { navigateToDeviceWithCurrency } = useDeviceNavigation({
    navigationStepManager,
    enableAccountSelection,
    onClose,
    resetSelection: reset,
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
    (selected: CryptoOrTokenCurrency, networks?: CryptoOrTokenCurrency[]) => {
      setAsset(selected);

      const availableNetworksList = networks ?? getNetworksForAsset(assetsSorted, selected.id);

      if (availableNetworksList.length > 1) {
        setAvailableNetworks(availableNetworksList);
        navigationStepManager.goToStep(ModularDrawerStep.Network);
      } else if (enableAccountSelection) {
        navigationStepManager.goToStep(ModularDrawerStep.Account);
      } else {
        navigateToDeviceWithCurrency(selected);
      }
    },
    [assetsSorted, enableAccountSelection, navigationStepManager, navigateToDeviceWithCurrency],
  );

  // Network navigation logic
  const goToNetwork = useCallback(
    (currency: CryptoOrTokenCurrency, networks: CryptoOrTokenCurrency[]) =>
      selectAsset(currency, networks),
    [selectAsset],
  );

  // Asset and network handlers with provider logic
  const handleAsset = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const assetNetworks = getNetworksForAsset(assetsSorted, currency.id);

      if (assetNetworks.length === 0) {
        selectAsset(currency);
        return;
      }
      goToNetwork(currency, assetNetworks);
    },
    [assetsSorted, goToNetwork, selectAsset],
  );

  const handleNetwork = useCallback(
    (selectedNetwork: CryptoOrTokenCurrency) => {
      if (!asset) return;
      const networksForAsset = getNetworksForAsset(assetsSorted, asset.id);

      const correspondingCurrency = networksForAsset.find(n =>
        n.type === "CryptoCurrency"
          ? n.id === selectedNetwork.id
          : n.parentCurrency.id === selectedNetwork.id,
      );

      if (correspondingCurrency) {
        proceedToNextStep(correspondingCurrency, selectedNetwork);
      }
    },
    [asset, assetsSorted, proceedToNextStep],
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

  // Auto-handle single currency when drawer opens (guarded per open)
  useEffect(() => {
    if (!isDrawerOpen) return;
    if (!singleCurrency) return;
    if (autoSelectRef.current) return;

    autoSelectRef.current = true;
    handleAsset(singleCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);

  // Reset guard and local selection when closing
  useEffect(() => {
    if (isDrawerOpen === false) {
      autoSelectRef.current = false;
      reset();
    }
  }, [isDrawerOpen, reset]);

  const assetForAccount = useMemo(() => {
    if (!asset) return undefined;
    if (!network) return asset;
    const networksForAsset = getNetworksForAsset(assetsSorted, asset.id);
    const correspondingCurrency = networksForAsset.find(n =>
      n.type === "CryptoCurrency" ? n.id === network.id : n.parentCurrency.id === network.id,
    );
    return correspondingCurrency ?? asset;
  }, [asset, network, assetsSorted]);

  const onAddNewAccount = useCallback(() => {
    if (!assetForAccount) return;
    navigateToDeviceWithCurrency(assetForAccount);
  }, [assetForAccount, navigateToDeviceWithCurrency]);

  return {
    asset,
    assetForAccount,
    network,
    availableNetworks,
    navigationStepManager,
    shouldShowBackButton,
    hasOneCurrency,
    onAddNewAccount,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
  };
}
