import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import AnimatedScreenWrapper from "./components/AnimatedScreenWrapper";
import { MODULAR_DIALOG_STEP, ModularDialogStep, NavigationDirection } from "./types";

const TranslationKeyMap: Record<ModularDialogStep, string> = {
  [MODULAR_DIALOG_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

interface ModularDialogContentProps {
  currentStep: ModularDialogStep;
  navigationDirection: NavigationDirection;
  handleClose: () => void;
  handleBack?: () => void;
  description?: string;
  renderStepContent: (step: ModularDialogStep) => React.ReactNode;
}

export const ModularDialogContent = ({
  currentStep,
  navigationDirection,
  handleClose,
  handleBack,
  renderStepContent,
  description,
}: ModularDialogContentProps) => {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader
        appearance="extended"
        title={t(TranslationKeyMap[currentStep])}
        description={description}
        onClose={handleClose}
        onBack={handleBack}
      />
      {/* The shrink-0 must stay until we got a fix from lumen team for the DialogBody (because of the flex-1) */}
      <DialogBody className="shrink-0 !px-16">
        <AnimatedScreenWrapper
          key={`${currentStep}-${navigationDirection}`}
          screenKey={currentStep}
          direction={navigationDirection}
        >
          {renderStepContent(currentStep)}
        </AnimatedScreenWrapper>
      </DialogBody>
    </>
  );
};
