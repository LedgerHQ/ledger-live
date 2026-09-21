import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import {
  modularDialogAreCurrenciesFilteredSelector,
  modularDialogConfigurationSelector,
  modularDialogCurrenciesSelector,
  modularDialogFlowSelector,
  modularDialogIsOpenSelector,
  modularDialogOnAccountSelectedSelector,
  modularDialogUiUseCaseSelector,
  resetModularDialogState,
} from "~/renderer/reducers/modularDialog";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { track } from "~/renderer/analytics/segment";
import { getModularDialogStepHeading } from "./hooks/getModularDialogStepHeading";
import { useHasAccountsForAsset } from "./hooks/useHasAccountsForAsset";
import { useModularDialogNavigation } from "./hooks/useModularDialogNavigation";
import { useModularDialogRemoteData } from "./hooks/useModularDialogRemoteData";
import { MODULAR_DIALOG_STEP } from "./types";

type UseModularDialogFlowViewModelParams = Readonly<{
  onClose?: () => void;
}>;

export function useModularDialogFlowViewModel({ onClose }: UseModularDialogFlowViewModelParams) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep, setCurrentStep } =
    useModularDialogNavigation();
  const flow = useSelector(modularDialogFlowSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);
  const onAccountSelected = useSelector(modularDialogOnAccountSelectedSelector);
  const dialogConfiguration = useSelector(modularDialogConfigurationSelector);
  const uiUseCase = useSelector(modularDialogUiUseCaseSelector);
  const currencyIds = useSelector(modularDialogCurrenciesSelector);
  const areCurrenciesFiltered = useSelector(modularDialogAreCurrenciesFilteredSelector);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      flow,
      page: currentRouteNameRef.current,
    });
    onClose?.();
  }, [flow, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(MODULAR_DIALOG_STEP.ASSET_SELECTION);

      return () => {
        dispatch(resetModularDialogState());
      };
    }
  }, [dispatch, isOpen, setCurrentStep]);

  const {
    errorInfo,
    refetch,
    loadingStatus,
    assetsToDisplay,
    disabledAssetIds,
    networksToDisplay,
    selectableNetworkIds,
    selectedAsset,
    selectedNetwork,
    handleAssetSelected,
    handleNetworkSelected,
    handleBack,
    loadNext,
    assetsSorted,
    accountAutoSkipState,
  } = useModularDialogRemoteData({
    currentStep,
    goToStep,
  });

  const { assetsConfiguration, networkConfiguration } = useModularDrawerConfiguration(
    "lldModularDrawer",
    dialogConfiguration,
  );
  const hasAccounts = useHasAccountsForAsset(selectedAsset);
  const isAwaitingAutoSkip =
    Boolean(areCurrenciesFiltered) &&
    currencyIds?.length === 1 &&
    currentStep === MODULAR_DIALOG_STEP.ASSET_SELECTION &&
    !errorInfo?.hasError &&
    accountAutoSkipState !== "unavailable";
  const displayStep = isAwaitingAutoSkip ? MODULAR_DIALOG_STEP.ACCOUNT_SELECTION : currentStep;

  const accountSelectionDescription =
    displayStep === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION && selectedNetwork?.name && !hasAccounts
      ? t("dialogs.selectAccount.description", {
          network: selectedNetwork.name,
        })
      : undefined;

  const { titleKey, descriptionKey } = getModularDialogStepHeading(
    displayStep,
    uiUseCase,
    hasAccounts,
  );

  return {
    assetsConfiguration,
    assetsSorted,
    assetsToDisplay,
    currentStep,
    description: descriptionKey ? t(descriptionKey) : accountSelectionDescription,
    disabledAssetIds,
    displayStep,
    errorInfo,
    handleAssetSelected,
    handleBack,
    handleClose,
    handleNetworkSelected,
    isAwaitingAutoSkip,
    isOpen,
    loadNext,
    loadingStatus,
    navigationDirection,
    networkConfiguration,
    networksToDisplay,
    onAccountSelected,
    refetch,
    selectableNetworkIds,
    selectedAsset,
    selectedNetwork,
    title: t(titleKey),
    uiUseCase,
  };
}
