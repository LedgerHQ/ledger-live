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
} from "./components";
import { Divider } from "@ledgerhq/lumen-ui-react";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";

export const WalletFeaturesDevToolContent = ({ expanded }: WalletFeaturesDevToolContentProps) => {
  const { t } = useTranslation();
  const {
    featureFlag,
    isEnabled,
    params,
    allEnabled,
    hasSeenWalletV4Tour,
    handleToggleAll,
    handleToggleEnabled,
    handleToggleParam,
    handleToggleHasSeenTour,
  } = useWalletFeaturesDevToolViewModel();
  const { isDialogOpen, handleOpenDialog, handleCloseDialog } = useWalletV4TourDrawerViewModel();

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

          <TourSection
            hasSeenTour={hasSeenWalletV4Tour}
            onToggleHasSeenTour={handleToggleHasSeenTour}
            onOpenDrawer={handleOpenDialog}
          />

          <WalletV4TourDialog isOpen={isDialogOpen} onClose={handleCloseDialog} />

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
