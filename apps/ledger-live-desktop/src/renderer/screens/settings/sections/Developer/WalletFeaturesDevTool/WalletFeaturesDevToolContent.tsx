import React from "react";
import { useTranslation } from "react-i18next";
import { WALLET_FEATURES_FLAG, WALLET_FEATURES_PARAMS } from "./constants";
import { WalletFeaturesDevToolContentProps } from "./types";
import { useWalletFeaturesDevToolViewModel } from "./hooks/useWalletFeaturesDevToolViewModel";
import {
  QuickActions,
  FeatureParamRow,
  FeatureFlagPreview,
  MainFeatureToggle,
  TourSection,
  Q2TourSection,
  Q3TourSection,
} from "./components";
import { Divider } from "@ledgerhq/lumen-ui-react";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";
import { Q2TourDialog, useQ2TourDrawerViewModel } from "LLD/features/Q2Tour";
import { Q3TourDialog, useQ3TourDrawerViewModel } from "LLD/features/Q3Tour";

export const WalletFeaturesDevToolContent = ({ expanded }: WalletFeaturesDevToolContentProps) => {
  const { t } = useTranslation();
  const {
    featureFlag,
    isEnabled,
    params,
    allEnabled,
    hasSeenWalletV4Tour,
    hasSeenQ2Tour,
    isQ2TourEnabled,
    hasSeenQ3Tour,
    isQ3TourEnabled,
    selectedQ3TourVariant,
    handleToggleAll,
    handleToggleEnabled,
    handleToggleParam,
    handleToggleHasSeenTour,
    handleToggleQ2TourHasSeen,
    handleToggleQ2TourEnabled,
    handleToggleQ3TourHasSeen,
    handleToggleQ3TourEnabled,
    handleQ3TourVariantChange,
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
  const {
    tour: q3Tour,
    isDialogOpen: isQ3TourOpen,
    handleOpenDialog: handleOpenQ3Tour,
    closeDrawer: closeQ3Tour,
    dismissDrawer: dismissQ3Tour,
    completeDrawer: completeQ3Tour,
    onSlideChange: onQ3TourSlideChange,
    onContinueClick: onQ3TourContinueClick,
  } = useQ3TourDrawerViewModel();

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
              <MainFeatureToggle
                flagName={WALLET_FEATURES_FLAG}
                switchName="wallet-features-enabled"
                isEnabled={isEnabled}
                onToggle={handleToggleEnabled}
              />
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
            isEnabled={isQ2TourEnabled}
            onToggleHasSeen={handleToggleQ2TourHasSeen}
            onToggleEnabled={handleToggleQ2TourEnabled}
            onOpenDrawer={handleOpenQ2Tour}
          />

          <Q3TourSection
            hasSeen={hasSeenQ3Tour}
            isEnabled={isQ3TourEnabled}
            selectedVariant={selectedQ3TourVariant}
            onToggleHasSeen={handleToggleQ3TourHasSeen}
            onToggleEnabled={handleToggleQ3TourEnabled}
            onVariantChange={handleQ3TourVariantChange}
            onOpenDrawer={handleOpenQ3Tour}
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

          <Q3TourDialog
            tour={q3Tour}
            isOpen={isQ3TourOpen}
            onHeaderClose={closeQ3Tour}
            onDismiss={dismissQ3Tour}
            onContinueClick={onQ3TourContinueClick}
            onComplete={completeQ3Tour}
            onSlideChange={onQ3TourSlideChange}
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
