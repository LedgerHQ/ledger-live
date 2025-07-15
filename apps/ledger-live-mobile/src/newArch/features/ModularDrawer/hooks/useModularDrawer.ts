import { useDispatch, useSelector } from "react-redux";
import {
  setModularDrawerStep,
  setModularDrawerSelectedAsset,
  setModularDrawerSelectedNetwork,
  setModularDrawerOpen,
} from "~/actions/modularDrawer";
import {
  currentStepSelector,
  isDrawerOpenSelector,
  selectedAssetSelector,
  selectedNetworkSelector,
} from "~/reducers/modularDrawer";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModularDrawerStep } from "LLM/features/ModularDrawer/types";
import { useMemo } from "react";

export const useModularDrawer = () => {
  const dispatch = useDispatch();

  const currentStep = useSelector(currentStepSelector);
  const selectedAsset = useSelector(selectedAssetSelector);
  const selectedNetwork = useSelector(selectedNetworkSelector);
  const isDrawerOpen = useSelector(isDrawerOpenSelector);

  const setStep = (step: ModularDrawerStep) => {
    dispatch(setModularDrawerStep(step));
  };

  const setSelectedAsset = (asset: CryptoOrTokenCurrency | null) => {
    dispatch(setModularDrawerSelectedAsset(asset));
  };

  const setSelectedNetwork = (network: CryptoOrTokenCurrency | null) => {
    dispatch(setModularDrawerSelectedNetwork(network));
  };

  const openDrawer = () => {
    dispatch(setModularDrawerOpen(true));
  };

  const closeDrawer = () => {
    dispatch(setModularDrawerOpen(false));
  };

  const initDrawer = (
    asset?: CryptoOrTokenCurrency | null,
    network?: CryptoOrTokenCurrency | null,
    step?: ModularDrawerStep,
  ) => {
    dispatch(setModularDrawerSelectedAsset(asset ?? null));
    dispatch(setModularDrawerSelectedNetwork(network ?? null));
    dispatch(setModularDrawerStep(step ?? ModularDrawerStep.Asset));
    openDrawer();
  };

  // Fonction utilitaire pour réinitialiser le state
  const resetState = () => {
    dispatch(setModularDrawerStep(ModularDrawerStep.Asset));
    dispatch(setModularDrawerSelectedAsset(null));
    dispatch(setModularDrawerSelectedNetwork(null));
  };

  /**
   * Go directly to a specific step in the flow, if it exists in the current steps.
   * @param step ModularDrawerStep to go to
   */
  const goToStep = (step: ModularDrawerStep) => {
    setStep(step);
  };

  const hasBackButton = useMemo(() => {
    return currentStep !== ModularDrawerStep.Asset;
  }, [currentStep]);

  return {
    hasBackButton,
    currentStep,
    selectedAsset,
    selectedNetwork,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    setStep,
    setSelectedAsset,
    setSelectedNetwork,
    resetState,
    initDrawer,
    goToStep,
  };
};
