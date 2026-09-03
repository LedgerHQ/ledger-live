import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import {
  getPerpsUiUseCase,
  PERPS_UI_USE_CASE,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
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

const TRANSLATION_KEYS: Record<ModularDialogStep, string> = {
  [MODULAR_DIALOG_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

type StepHeading = {
  titleKey: string;
  descriptionKey?: string;
};

/** Translation keys for a step's title and description, given the perps use case. */
function getStepHeading(
  step: ModularDialogStep,
  uiUseCase: string | undefined,
  hasAccounts: boolean,
): StepHeading {
  const perpsUseCase = getPerpsUiUseCase(uiUseCase);

  if (step === MODULAR_DIALOG_STEP.ASSET_SELECTION && perpsUseCase === PERPS_UI_USE_CASE.fund) {
    return {
      titleKey: "modularAssetDrawer.selectDepositCurrencyTitle",
      descriptionKey: "modularAssetDrawer.selectDepositCurrencyDescription",
    };
  }

  if (
    step === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION &&
    perpsUseCase === PERPS_UI_USE_CASE.receive
  ) {
    return {
      titleKey: "modularAssetDrawer.selectAccountPerpsTitle",
      descriptionKey: hasAccounts
        ? "modularAssetDrawer.selectAccountPerpsDescription"
        : "modularAssetDrawer.selectAccountPerpsEmptyDescription",
    };
  }

  return { titleKey: TRANSLATION_KEYS[step] };
}

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
            disabledAssetIds={disabledAssetIds}
          />
        );
      case MODULAR_DIALOG_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelector
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
            selectableNetworkIds={selectableNetworkIds}
          />
        );
      case MODULAR_DIALOG_STEP.ACCOUNT_SELECTION:
        if (selectedAsset && selectedNetwork && onAccountSelected) {
          return (
            <AccountSelector
              asset={selectedAsset}
              onAccountSelected={onAccountSelected}
              uiUseCase={uiUseCase}
            />
          );
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

  const { titleKey, descriptionKey } = getStepHeading(currentStep, uiUseCase, hasAccounts);
  const title = t(titleKey);
  const description = descriptionKey ? t(descriptionKey) : accountSelectionDescription;

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
