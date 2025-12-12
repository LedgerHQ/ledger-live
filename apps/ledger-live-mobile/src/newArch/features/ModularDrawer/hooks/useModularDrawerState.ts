import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModularDrawerStep } from "../types";
import { useStepNavigation } from "./useStepNavigation";
import { useDeviceNavigation } from "./useDeviceNavigation";
import { useDrawerLifecycle } from "./useDrawerLifecycle";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { getNetworksForAsset, resolveCurrency } from "../utils/helpers";
import { useSelector, useDispatch } from "~/context/store";
import { modularDrawerEnableAccountSelectionSelector, setStep } from "~/reducers/modularDrawer";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import type { ModularDrawerProps } from "../ModularDrawer";

type ModularDrawerStateProps = {
  assetsSorted?: AssetData[];
  selectedStep?: ModularDrawerStep;
  currencyIds: string[];
  isDrawerOpen?: boolean;
  onClose?: () => void;
  onAccountSelected: ModularDrawerProps["onAccountSelected"];
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
  const isAcceptedCurrency = useAcceptedCurrency();
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
        isAcceptedCurrency,
      );

      if (availableNetworksList.length > 1) {
        setAvailableNetworks(availableNetworksList);
        dispatch(setStep(ModularDrawerStep.Network));
      } else if (availableNetworksList.length === 1) {
        const singleNetwork = availableNetworksList[0];
        const resolvedCurrency = resolveCurrency(
          assetsSorted,
          isAcceptedCurrency,
          selected,
          singleNetwork,
        );
        const currencyToUse = resolvedCurrency ?? selected;
        proceedToNextStep(currencyToUse, singleNetwork);
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
      isAcceptedCurrency,
    ],
  );

  // Handle network selection and proceed
  const handleNetwork = useCallback(
    (selectedNetwork: CryptoOrTokenCurrency) => {
      if (!asset) return;
      const correspondingCurrency = resolveCurrency(
        assetsSorted,
        isAcceptedCurrency,
        asset,
        selectedNetwork,
      );
      if (correspondingCurrency) {
        proceedToNextStep(correspondingCurrency, selectedNetwork);
      }
    },
    [asset, assetsSorted, proceedToNextStep, isAcceptedCurrency],
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
    () => resolveCurrency(assetsSorted, isAcceptedCurrency, asset, network),
    [asset, network, assetsSorted, isAcceptedCurrency],
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
