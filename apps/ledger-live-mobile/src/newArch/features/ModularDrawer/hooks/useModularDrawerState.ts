import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import { ModularDrawerStep } from "../types";

import { useStepNavigation } from "./useStepNavigation";
import { useDeviceNavigation } from "./useDeviceNavigation";
import { useDrawerLifecycle } from "./useDrawerLifecycle";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { getNetworksForAsset, resolveCurrency } from "../utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import { modularDrawerEnableAccountSelectionSelector, setStep } from "~/reducers/modularDrawer";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";

type ModularDrawerStateProps = {
  assetsSorted?: AssetData[];
  selectedStep?: ModularDrawerStep;
  currencyIds: string[];
  isDrawerOpen?: boolean;
  onClose?: () => void;
  onAccountSelected?: (account: AccountLike) => void;
  hasSearchedValue?: boolean;
};

export function useModularDrawerState({
  assetsSorted,
  currencyIds,
  isDrawerOpen,
  onClose,
  hasSearchedValue,
  onAccountSelected,
}: ModularDrawerStateProps) {
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const enableAccountSelection = useSelector(modularDrawerEnableAccountSelectionSelector);
  const dispatch = useDispatch();

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
    onClose,
    resetSelection: reset,
    onAccountSelected,
  });

  const {
    canGoBackToAsset,
    canGoBackToNetwork,
    backToAsset,
    backToNetwork,
    shouldShowBackButton,
    proceedToNextStep,
  } = useStepNavigation({
    availableNetworksCount: availableNetworks.length,
    hasOneCurrency,
    resetSelection: reset,
    clearNetwork,
    selectNetwork: setNetwork,
    navigateToDeviceWithCurrency,
  });

  // Handle asset selection and determine next step
  const handleAsset = useCallback(
    (selected: CryptoOrTokenCurrency) => {
      setAsset(selected);
      const availableNetworksList = getNetworksForAsset(
        assetsSorted,
        selected.id,
        deactivatedCurrencyIds,
      );

      if (availableNetworksList.length > 1) {
        setAvailableNetworks(availableNetworksList);
        dispatch(setStep(ModularDrawerStep.Network));
      } else if (availableNetworksList.length === 1) {
        const singleNetwork = availableNetworksList[0];
        const resolvedCurrency = resolveCurrency(
          assetsSorted,
          deactivatedCurrencyIds,
          selected,
          singleNetwork,
        );
        proceedToNextStep(resolvedCurrency ?? selected, singleNetwork);
      } else if (enableAccountSelection) {
        dispatch(setStep(ModularDrawerStep.Account));
      } else {
        navigateToDeviceWithCurrency(selected);
      }
    },
    [
      assetsSorted,
      enableAccountSelection,
      dispatch,
      navigateToDeviceWithCurrency,
      proceedToNextStep,
      deactivatedCurrencyIds,
    ],
  );

  // Handle network selection and proceed
  const handleNetwork = useCallback(
    (selectedNetwork: CryptoOrTokenCurrency) => {
      if (!asset) return;
      const correspondingCurrency = resolveCurrency(
        assetsSorted,
        deactivatedCurrencyIds,
        asset,
        selectedNetwork,
      );
      if (correspondingCurrency) proceedToNextStep(correspondingCurrency, selectedNetwork);
    },
    [asset, assetsSorted, proceedToNextStep, deactivatedCurrencyIds],
  );

  const { handleBackButton, handleCloseButton } = useDrawerLifecycle({
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
    () => resolveCurrency(assetsSorted, deactivatedCurrencyIds, asset, network),
    [asset, network, assetsSorted, deactivatedCurrencyIds],
  );

  const onAddNewAccount = () => {
    if (!accountCurrency) return;
    navigateToDeviceWithCurrency(accountCurrency);
  };

  return {
    accountCurrency,
    network,
    availableNetworks,
    shouldShowBackButton,
    hasOneCurrency,
    onAddNewAccount,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
  };
}
