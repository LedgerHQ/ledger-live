import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DRAWER_STEP, ModularDrawerFlowManagerProps, ModularDrawerStep } from "./types";
import AssetSelector from "./screens/AssetSelector";
import { NetworkSelector } from "./screens/NetworkSelector";
import { AccountSelector } from "./screens/AccountSelector";
import { useModularDrawerNavigation } from "./hooks/useModularDrawerNavigation";
import { useModularDrawerRemoteData } from "./hooks/useModularDrawerRemoteData";
import {
  resetModularDrawerState,
  modularDrawerFlowSelector,
  modularDialogIsOpenSelector,
  closeDialog,
} from "~/renderer/reducers/modularDrawer";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

const ModularDialogFlowManager = ({
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  onAssetSelected,
  onAccountSelected,
  onClose,
}: ModularDrawerFlowManagerProps) => {
  const currencyIds = useMemo(() => currencies, [currencies]);
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();
  const flow = useSelector(modularDrawerFlowSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);

  const { t } = useTranslation();

  const handleClose = () => {
    track("button_clicked", {
      button: "Close",
      flow,
      page: currentRouteNameRef.current,
    });
    dispatch(closeDialog());
    onClose?.();
  };

  useEffect(() => {
    return () => {
      dispatch(resetModularDrawerState());
    };
  }, [dispatch]);

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
  } = useModularDrawerRemoteData({
    currentStep,
    currencyIds,
    goToStep,
    onAssetSelected,
    isSelectAccountFlow: Boolean(onAccountSelected),
    useCase,
    areCurrenciesFiltered,
  });

  const { assetsConfiguration, networkConfiguration } = useModularDrawerConfiguration(
    "lldModularDrawer",
    drawerConfiguration,
  );

  const renderStepContent = (step: ModularDrawerStep) => {
    switch (step) {
      case MODULAR_DRAWER_STEP.ASSET_SELECTION:
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
      case MODULAR_DRAWER_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelector
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
          />
        );
      case MODULAR_DRAWER_STEP.ACCOUNT_SELECTION:
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
      <DialogContent>
        <DialogHeader
          appearance="extended"
          title={t(TranslationKeyMap[currentStep])}
          onClose={handleClose}
          onBack={handleBack}
        />
        <div className="h-[480px] overflow-hidden">
          <AnimatedScreenWrapper
            key={`${currentStep}-${navigationDirection}`}
            screenKey={currentStep}
            direction={navigationDirection}
          >
            {renderStepContent(currentStep)}
          </AnimatedScreenWrapper>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModularDialogFlowManager;
