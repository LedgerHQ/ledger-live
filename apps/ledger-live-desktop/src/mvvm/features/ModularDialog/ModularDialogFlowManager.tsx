import React from "react";
import { useTranslation } from "react-i18next";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { ModularDialogFlow } from "./ModularDialogFlow";
import {
  MODULAR_DIALOG_STEP,
  type ModularDialogFlowManagerProps,
  type ModularDialogStep,
} from "./types";

const TRANSLATION_KEYS: Record<ModularDialogStep, string> = {
  [MODULAR_DIALOG_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

const ModularDialogFlowManager = ({ onClose }: ModularDialogFlowManagerProps) => {
  const { t } = useTranslation();

  return (
    <ModularDialogFlow onClose={onClose}>
      {({
        content,
        currentStep,
        description,
        hasBackButton,
        isOpen,
        onBack,
        onClose: handleClose,
      }) => {
        const createScreen = (
          step: ModularDialogStep,
        ): DialogFlowScreenRegistry<ModularDialogStep>[ModularDialogStep] => ({
          content,
          options: {
            dialogHeaderProps: {
              density: "expanded",
              description: step === currentStep ? description : undefined,
              title: t(TRANSLATION_KEYS[step]),
            },
            hasBackButton: step === currentStep && hasBackButton,
          },
        });
        const screens: DialogFlowScreenRegistry<ModularDialogStep> = {
          [MODULAR_DIALOG_STEP.ASSET_SELECTION]: createScreen(MODULAR_DIALOG_STEP.ASSET_SELECTION),
          [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: createScreen(
            MODULAR_DIALOG_STEP.NETWORK_SELECTION,
          ),
          [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: createScreen(
            MODULAR_DIALOG_STEP.ACCOUNT_SELECTION,
          ),
        };

        return (
          <DialogFlow
            currentStep={currentStep}
            defaultOptions={{
              dialogBodyProps: { className: "px-16!" },
              dialogContentProps: { className: "pb-0" },
            }}
            isOpen={isOpen}
            onBack={onBack}
            onClose={handleClose}
            screens={screens}
          />
        );
      }}
    </ModularDialogFlow>
  );
};

export default ModularDialogFlowManager;
