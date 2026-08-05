import React from "react";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { ModularDialogFlow } from "./ModularDialogFlow";
import {
  MODULAR_DIALOG_STEP,
  type ModularDialogFlowManagerProps,
  type ModularDialogFlowRenderProps,
  type ModularDialogStep,
} from "./types";

type CreateScreensParams = Pick<
  ModularDialogFlowRenderProps,
  "content" | "currentStep" | "title" | "description" | "hasBackButton"
>;

function createScreens({
  content,
  currentStep,
  title,
  description,
  hasBackButton,
}: CreateScreensParams): DialogFlowScreenRegistry<ModularDialogStep> {
  const createScreen = (
    step: ModularDialogStep,
  ): DialogFlowScreenRegistry<ModularDialogStep>[ModularDialogStep] => ({
    content,
    options: {
      dialogHeaderProps: {
        density: "expanded",
        description: step === currentStep ? description : undefined,
        title,
      },
      hasBackButton: step === currentStep && hasBackButton,
    },
  });

  return {
    [MODULAR_DIALOG_STEP.ASSET_SELECTION]: createScreen(MODULAR_DIALOG_STEP.ASSET_SELECTION),
    [MODULAR_DIALOG_STEP.NETWORK_SELECTION]: createScreen(MODULAR_DIALOG_STEP.NETWORK_SELECTION),
    [MODULAR_DIALOG_STEP.ACCOUNT_SELECTION]: createScreen(MODULAR_DIALOG_STEP.ACCOUNT_SELECTION),
  };
}

const ModularDialogFlowManager = ({ onClose }: ModularDialogFlowManagerProps) => {
  return (
    <ModularDialogFlow onClose={onClose}>
      {({
        content,
        currentStep,
        title,
        description,
        hasBackButton,
        isOpen,
        onBack,
        onClose: handleClose,
      }) => {
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
            screens={createScreens({
              content,
              currentStep,
              title,
              description,
              hasBackButton,
            })}
          />
        );
      }}
    </ModularDialogFlow>
  );
};

export default ModularDialogFlowManager;
