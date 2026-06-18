import React from "react";
import { useTranslation } from "react-i18next";
import { WALLET_FEATURES_PARAMS } from "./constants";
import { WalletFeaturesDevToolContentProps } from "./types";
import { useWalletFeaturesDevToolViewModel } from "./hooks/useWalletFeaturesDevToolViewModel";
import {
  QuickActions,
  FeatureParamRow,
  FeatureFlagPreview,
  MainFeatureToggle,
  TourSection,
  Q2TourSection,
} from "./components";
import { Divider } from "@ledgerhq/lumen-ui-react";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";
import { Q2TourDialog, useQ2TourDrawerViewModel } from "LLD/features/Q2Tour";
export const WalletFeaturesDevToolContent = ({ expanded }: WalletFeaturesDevToolContentProps) => {
  const { t } = useTranslation();
  const {
    featureFlag,
    isEnabled,
    params,
    allEnabled,
    hasSeenWalletV4Tour,
    hasSeenQ2Tour,
    handleToggleAll,
    handleToggleEnabled,
    handleToggleParam,
    handleToggleHasSeenTour,
    handleToggleQ2TourHasSeen,
  } = useWalletFeaturesDevToolViewModel();
  const { isDialogOpen, handleOpenDialog, closeDrawer, completeDrawer, onSlideChange } =
    useWalletV4TourDrawerViewModel();
  const {
    isDialogOpen: isQ2TourOpen,
    handleOpenDialog: handleOpenQ2Tour,
    closeDrawer: closeQ2Tour,
    dismissDrawer: dismissQ2Tour,
    completeDrawer: completeQ2Tour,
    onSlideChange: onQ2TourSlideChange,
    onContinueClick: onQ2TourContinueClick,
  } = useQ2TourDrawerViewModel();

  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-muted">{t("settings.developer.walletFeaturesDevTool.description")}</p>

      {expanded && (
        <div className="mt-4 flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <span className="body-2-semi-bold text-muted">
                {t("settings.developer.walletFeaturesDevTool.mainFeatureToggle")}
              </span>
              <Divider />
              <MainFeatureToggle isEnabled={isEnabled} onToggle={handleToggleEnabled} />
            </div>
            <div className="flex flex-col gap-4">
              <span className="body-2-semi-bold text-muted">
                {t("settings.developer.walletFeaturesDevTool.featureParameters")}
              </span>
              <Divider />
              <div className="flex flex-col rounded-md bg-surface px-4 py-1">
                {WALLET_FEATURES_PARAMS.map(({ key, label }) => (
                  <FeatureParamRow
                    key={key}
                    paramKey={key}
                    label={label}
                    isEnabled={isEnabled}
                    isSelected={isEnabled && (params[key] ?? false)}
                    onToggle={() => handleToggleParam(key)}
                  />
                ))}
              </div>
            </div>
          </div>

          <Q2TourSection
            hasSeen={hasSeenQ2Tour}
            onToggleHasSeen={handleToggleQ2TourHasSeen}
            onOpenDrawer={handleOpenQ2Tour}
          />

          <TourSection
            hasSeenTour={hasSeenWalletV4Tour}
            onToggleHasSeenTour={handleToggleHasSeenTour}
            onOpenDrawer={handleOpenDialog}
          />

          <WalletV4TourDialog
            isOpen={isDialogOpen}
            onClose={closeDrawer}
            onComplete={completeDrawer}
            onSlideChange={onSlideChange}
          />

          <Q2TourDialog
            isOpen={isQ2TourOpen}
            onHeaderClose={closeQ2Tour}
            onDismiss={dismissQ2Tour}
            onContinueClick={onQ2TourContinueClick}
            onComplete={completeQ2Tour}
            onSlideChange={onQ2TourSlideChange}
          />

          <div className="flex gap-4">
            <QuickActions
              allEnabled={allEnabled}
              isEnabled={isEnabled}
              onEnableAll={() => handleToggleAll(true)}
              onDisableAll={() => handleToggleAll(false)}
            />
            <FeatureFlagPreview featureFlag={featureFlag} />
          </div>
        </div>
      )}
    </div>
  );
};
