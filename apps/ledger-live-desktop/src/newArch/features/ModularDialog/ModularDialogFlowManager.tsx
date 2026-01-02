import React, { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { MODULAR_DIALOG_STEP, ModularDialogFlowManagerProps, ModularDialogStep } from "./types";
import AssetSelector from "./screens/AssetSelector";
import { NetworkSelector } from "./screens/NetworkSelector";
import { AccountSelector } from "./screens/AccountSelector";
import { useModularDialogNavigation } from "./hooks/useModularDialogNavigation";
import { useModularDialogRemoteData } from "./hooks/useModularDialogRemoteData";
import {
  resetModularDrawerState,
  modularDrawerFlowSelector,
  modularDialogIsOpenSelector,
  modularDialogConfiguration,
  modularDialogOnAccountSelected,
} from "~/renderer/reducers/modularDrawer";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { ModularDialogContent } from "./ModularDialogContent";
import { useTranslation } from "react-i18next";
import { useHasAccountsForAsset } from "./hooks/useHasAccountsForAsset";

const ModularDialogFlowManager = ({ onClose }: ModularDialogFlowManagerProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep, setCurrentStep } =
    useModularDialogNavigation();
  const flow = useSelector(modularDrawerFlowSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);
  const onAccountSelected = useSelector(modularDialogOnAccountSelected);
  const dialogConfiguration = useSelector(modularDialogConfiguration);

  const handleClose = () => {
    track("button_clicked", {
      button: "Close",
      flow,
      page: currentRouteNameRef.current,
    });
    onClose?.();
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(MODULAR_DIALOG_STEP.ASSET_SELECTION);
    } else {
      dispatch(resetModularDrawerState());
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="pb-0">
        <ModularDialogContent
          currentStep={currentStep}
          navigationDirection={navigationDirection}
          handleClose={handleClose}
          handleBack={handleBack}
          renderStepContent={renderStepContent}
          description={
            currentStep === MODULAR_DIALOG_STEP.ACCOUNT_SELECTION &&
            selectedNetwork?.name &&
            !hasAccounts
              ? t("dialogs.selectAccount.description", { network: selectedNetwork.name })
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModularDialogFlowManager;
