import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import {
  modularDialogConfigurationSelector,
  modularDialogFlowSelector,
  modularDialogIsOpenSelector,
  modularDialogOnAccountSelectedSelector,
  modularDialogUiUseCaseSelector,
  resetModularDialogState,
} from "~/renderer/reducers/modularDialog";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { track } from "~/renderer/analytics/segment";
import { AccountSelector } from "./screens/AccountSelector";
import AssetSelector from "./screens/AssetSelector";
import { NetworkSelector } from "./screens/NetworkSelector";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { useHasAccountsForAsset } from "./hooks/useHasAccountsForAsset";
import { useModularDialogNavigation } from "./hooks/useModularDialogNavigation";
import { useModularDialogRemoteData } from "./hooks/useModularDialogRemoteData";
import { MODULAR_DIALOG_STEP, type ModularDialogFlowProps, type ModularDialogStep } from "./types";
import { parseUiUseCase } from "./utils/parseUiUseCase";

const TRANSLATION_KEYS: Record<ModularDialogStep, string> = {
  [MODULAR_DIALOG_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

export function ModularDialogFlow({
  children,
  fillAvailableHeight,
  onClose,
}: ModularDialogFlowProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep, setCurrentStep } =
    useModularDialogNavigation();
  const flow = useSelector(modularDialogFlowSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);
  const onAccountSelected = useSelector(modularDialogOnAccountSelectedSelector);
  const dialogConfiguration = useSelector(modularDialogConfigurationSelector);
  const uiUseCase = useSelector(modularDialogUiUseCaseSelector);

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
    networksToDisplay,
    selectedAsset,
    selectedNetwork,
    handleAssetSelected,
    handleNetworkSelected,
    handleBack,
    loadNext,
    assetsSorted,
  } = useModularDialogRemoteData({
    currentStep,
    goToStep,
  });

  const { assetsConfiguration, networkConfiguration } = useModularDrawerConfiguration(
    "lldModularDrawer",
    dialogConfiguration,
  );
  const hasAccounts = useHasAccountsForAsset(selectedAsset);

  const renderStepContent = (step: ModularDialogStep) => {
    switch (step) {
      case MODULAR_DIALOG_STEP.ASSET_SELECTION:
        return (
          <AssetSelector
            assetsToDisplay={assetsToDisplay}
            providersLoadingStatus={loadingStatus}
            assetsConfiguration={assetsConfiguration}
            fillAvailableHeight={fillAvailableHeight}
            onAssetSelected={handleAssetSelected}
            loadNext={loadNext}
            errorInfo={errorInfo}
            refetch={refetch}
            assetsSorted={assetsSorted}
          />
        );
      case MODULAR_DIALOG_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelector
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
          />
        );
      case MODULAR_DIALOG_STEP.ACCOUNT_SELECTION:
        if (selectedAsset && selectedNetwork && onAccountSelected) {
          return <AccountSelector asset={selectedAsset} onAccountSelected={onAccountSelected} />;
        }
        return null;
      default:
        return null;
    }
  };

  const content = (
    <AnimatedScreenWrapper
      key={`${currentStep}-${navigationDirection}`}
      fillAvailableHeight={fillAvailableHeight}
      screenKey={currentStep}
      direction={navigationDirection}
    >
      {renderStepContent(currentStep)}
    </AnimatedScreenWrapper>
  );

  const accountSelectionDescription =
    currentStep === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION && selectedNetwork?.name && !hasAccounts
      ? t("dialogs.selectAccount.description", {
          network: selectedNetwork.name,
        })
      : undefined;

  const { isPerpsWithoutVariant, isPerpsDeposit } = parseUiUseCase(uiUseCase);
  const { title, flowDescription } = ((): { title: string; flowDescription?: string } => {
    if (currentStep === MODULAR_DIALOG_STEP.ASSET_SELECTION && isPerpsDeposit) {
      return {
        title: t("modularAssetDrawer.selectDepositCurrencyTitle"),
        flowDescription: t("modularAssetDrawer.selectDepositCurrencyDescription"),
      };
    }
    if (currentStep === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION && isPerpsWithoutVariant) {
      return {
        title: t("modularAssetDrawer.selectAccountPerpsTitle"),
        flowDescription: t("modularAssetDrawer.selectAccountPerpsDescription"),
      };
    }
    return { title: t(TRANSLATION_KEYS[currentStep]) };
  })();

  const description = accountSelectionDescription ?? flowDescription;

  return (
    <>
      {children({
        content,
        currentStep,
        title,
        description,
        hasBackButton: Boolean(handleBack),
        isOpen,
        navigationDirection,
        onBack: handleBack,
        onClose: handleClose,
      })}
    </>
  );
}
