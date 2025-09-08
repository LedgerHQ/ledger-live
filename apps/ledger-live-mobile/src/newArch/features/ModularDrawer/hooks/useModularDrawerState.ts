import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { ModularDrawerStep } from "../types";

import { useModularDrawerFlowStepManager } from "./useModularDrawerFlowStepManager";
import { useStepNavigation } from "./useStepNavigation";
import { useDeviceNavigation } from "./useDeviceNavigation";
import { useDrawerLifecycle } from "./useDrawerLifecycle";
import { AssetsData } from "./useAssets";
import { getNetworksForAsset, resolveCurrency } from "../utils/helpers";

type ModularDrawerStateProps = {
  assetsSorted: AssetsData;
  selectedStep?: ModularDrawerStep;
  currencyIds: string[];
  isDrawerOpen?: boolean;
  enableAccountSelection?: boolean;
  onClose?: () => void;
  onAccountSelected?: (account: Account) => void;
  readonly flow: string;
  hasSearchedValue?: boolean;
};

export function useModularDrawerState({
  assetsSorted,
  currencyIds,
  isDrawerOpen,
  enableAccountSelection,
  onClose,
  flow,
  hasSearchedValue,
}: ModularDrawerStateProps) {
  const navigationStepManager = useModularDrawerFlowStepManager();

  const [asset, setAsset] = useState<CryptoOrTokenCurrency>();
  const [network, setNetwork] = useState<CryptoOrTokenCurrency>();
  const [availableNetworks, setAvailableNetworks] = useState<CryptoOrTokenCurrency[]>([]);
  const autoSelectRef = useRef(false);

  const singleCurrency = useMemo(
    () => (assetsSorted?.length === 1 ? assetsSorted[0].networks[0] : undefined),
    [assetsSorted],
  );

  const hasOneCurrency = useMemo(() => currencyIds.length === 1, [currencyIds.length]);

  const clearNetwork = () => setNetwork(undefined);

  const reset = useCallback(() => {
    setAsset(undefined);
    setNetwork(undefined);
    setAvailableNetworks([]);
  }, []);

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
    selectNetwork: setNetwork,
    enableAccountSelection,
    navigateToDeviceWithCurrency,
  });

  // Handle asset selection and determine next step
  const handleAsset = useCallback(
    (selected: CryptoOrTokenCurrency, networks?: CryptoOrTokenCurrency[]) => {
      setAsset(selected);
      const availableNetworksList = networks ?? getNetworksForAsset(assetsSorted, selected.id);

      if (availableNetworksList.length > 1) {
        setAvailableNetworks(availableNetworksList);
        navigationStepManager.goToStep(ModularDrawerStep.Network);
      } else if (availableNetworksList.length === 1) {
        const singleNetwork = availableNetworksList[0];
        const resolvedCurrency = resolveCurrency(assetsSorted, selected, singleNetwork);
        proceedToNextStep(resolvedCurrency ?? selected, singleNetwork);
      } else if (enableAccountSelection) {
        navigationStepManager.goToStep(ModularDrawerStep.Account);
      } else {
        navigateToDeviceWithCurrency(selected);
      }
    },
    [
      assetsSorted,
      enableAccountSelection,
      navigationStepManager,
      navigateToDeviceWithCurrency,
      proceedToNextStep,
    ],
  );

  // Handle network selection and proceed
  const handleNetwork = useCallback(
    (selectedNetwork: CryptoOrTokenCurrency) => {
      if (!asset) return;
      const correspondingCurrency = resolveCurrency(assetsSorted, asset, selectedNetwork);
      if (correspondingCurrency) proceedToNextStep(correspondingCurrency, selectedNetwork);
    },
    [asset, assetsSorted, proceedToNextStep],
  );

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

  // Auto-select single currency if drawer is open and only one is available
  useEffect(() => {
    if (hasSearchedValue || !isDrawerOpen || !singleCurrency || autoSelectRef.current) return;
    autoSelectRef.current = true;
    handleAsset(singleCurrency);
  }, [isDrawerOpen, singleCurrency, handleAsset, hasSearchedValue]);

  // Reset state when drawer closes
  useEffect(() => {
    if (isDrawerOpen === false) {
      autoSelectRef.current = false;
      reset();
    }
  }, [isDrawerOpen, reset]);

  const accountCurrency = useMemo(
    () => resolveCurrency(assetsSorted, asset, network),
    [asset, network, assetsSorted],
  );

  const onAddNewAccount = () => {
    if (!accountCurrency) return;
    navigateToDeviceWithCurrency(accountCurrency);
  };

  return {
    asset,
    accountCurrency,
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
