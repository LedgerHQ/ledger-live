import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AnimatePresence } from "framer-motion";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DRAWER_STEP, ModularDrawerFlowManagerProps, ModularDrawerStep } from "./types";
import AssetSelection from "./screens/AssetSelection";
import { NetworkSelection } from "./screens/NetworkSelection";
import { AccountSelection } from "./screens/AccountSelection";
import { useModularDrawerNavigation } from "./hooks/useModularDrawerNavigation";
import { useModularDrawerRemoteData } from "./hooks/useModularDrawerRemoteData";
import { resetModularDrawerState } from "~/renderer/reducers/modularDrawer";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import { DialogHeader } from "@ledgerhq/ldls-ui-react";
import { useDialog } from "LLD/components/Dialog";
import { useTranslation } from "react-i18next";

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
}: ModularDrawerFlowManagerProps) => {
  const currencyIds = useMemo(() => currencies, [currencies]);
  const dispatch = useDispatch();
  const { currentStep, navigationDirection, goToStep } = useModularDrawerNavigation();
  const { closeDialog } = useDialog();

  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      dispatch(resetModularDrawerState());
    };
  }, [dispatch]);

  const {
    error,
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
          <AssetSelection
            assetsToDisplay={assetsToDisplay}
            providersLoadingStatus={loadingStatus}
            assetsConfiguration={assetsConfiguration}
            onAssetSelected={handleAssetSelected}
            loadNext={loadNext}
            error={!!error}
            refetch={refetch}
            assetsSorted={assetsSorted}
          />
        );
      case MODULAR_DRAWER_STEP.NETWORK_SELECTION:
        return (
          <NetworkSelection
            networks={networksToDisplay}
            networksConfiguration={networkConfiguration}
            onNetworkSelected={handleNetworkSelected}
            selectedAssetId={selectedAsset?.id}
          />
        );
      case MODULAR_DRAWER_STEP.ACCOUNT_SELECTION:
        if (selectedAsset && selectedNetwork && onAccountSelected) {
          return <AccountSelection asset={selectedAsset} onAccountSelected={onAccountSelected} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <>
      <DialogHeader
        appearance="extended"
        title={t(TranslationKeyMap[currentStep])}
        onClose={closeDialog}
        onBack={handleBack}
      />
      <div style={{ height: "480px", overflow: "hidden" }}>
        <AnimatePresence initial={false} custom={navigationDirection} mode="sync">
          <AnimatedScreenWrapper
            key={currentStep}
            screenKey={currentStep}
            direction={navigationDirection}
          >
            {renderStepContent(currentStep)}
          </AnimatedScreenWrapper>
        </AnimatePresence>
      </div>
    </>
  );
};

export default ModularDialogFlowManager;
