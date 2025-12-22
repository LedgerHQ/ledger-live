import React from "react";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DRAWER_STEP, ModularDrawerStep, NavigationDirection } from "./types";

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

interface ModularDialogContentProps {
  currentStep: ModularDrawerStep;
  navigationDirection: NavigationDirection;
  handleClose: () => void;
  handleBack?: () => void;
  renderStepContent: (step: ModularDrawerStep) => React.ReactNode;
}

export const ModularDialogContent = ({
  currentStep,
  navigationDirection,
  handleClose,
  handleBack,
  renderStepContent,
}: ModularDialogContentProps) => {
  const { t } = useTranslation();

  return (
    <>
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
    </>
  );
};
