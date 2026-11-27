import React from "react";
import { useTranslation } from "react-i18next";
import { DialogFlow, type DialogFlowScreenRegistry } from "LLD/components/DialogFlow";
import { useRestoreFocusOnDialogClose } from "LLD/hooks/useRestoreFocusOnDialogClose";
import { ModularDialogFlow } from "./ModularDialogFlow";
import { NetworkHelpOverlay } from "./components/NetworkHelp/NetworkHelpOverlay";
import {
  MODULAR_DIALOG_STEP,
  type ModularDialogFlowManagerProps,
  type ModularDialogFlowRenderProps,
  type ModularDialogStep,
} from "./types";

const NETWORK_HELP_STEP = "NETWORK_HELP";
type ManagerStep = ModularDialogStep | typeof NETWORK_HELP_STEP;

type CreateScreensParams = Pick<
  ModularDialogFlowRenderProps,
  "content" | "currentStep" | "title" | "description" | "hasBackButton"
> &
  Readonly<{ networkHelpScreen: DialogFlowScreenRegistry<ManagerStep>[typeof NETWORK_HELP_STEP] }>;

function createScreens({
  content,
  currentStep,
  title,
  description,
  hasBackButton,
  networkHelpScreen,
}: CreateScreensParams): DialogFlowScreenRegistry<ManagerStep> {
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
    [NETWORK_HELP_STEP]: networkHelpScreen,
  };
}

const ModularDialogFlowManager = ({ onClose }: ModularDialogFlowManagerProps) => {
  const { t } = useTranslation();
  const focusLifecycle = useRestoreFocusOnDialogClose();

  return (
    <ModularDialogFlow onClose={onClose}>
      {({
        content,
        currentStep,
        title,
        description,
        hasBackButton,
        isOpen,
        networkHelp,
        onBack,
        onClose: handleClose,
      }) => {
        const isNetworkHelpOpen = !!networkHelp?.isOpen;
        // Every screen renders this same tree, and the help only covers the step: hiding it with
        // `display: none` would replay its slide-in once the help closes.
        const screenContent = (
          <div className="relative">
            <div
              className={isNetworkHelpOpen ? "invisible" : undefined}
              aria-hidden={isNetworkHelpOpen || undefined}
            >
              {content}
            </div>
            {isNetworkHelpOpen ? <NetworkHelpOverlay /> : null}
          </div>
        );
        return (
          <DialogFlow<ManagerStep>
            currentStep={isNetworkHelpOpen ? NETWORK_HELP_STEP : currentStep}
            defaultOptions={{
              dialogBodyProps: { className: "px-16!" },
              dialogContentProps: { className: "pb-0", ...focusLifecycle },
            }}
            isOpen={isOpen}
            onBack={onBack}
            // The help closes back to the network list, not the whole dialog.
            onClose={isNetworkHelpOpen ? networkHelp.close : handleClose}
            screens={createScreens({
              content: screenContent,
              currentStep,
              title,
              description,
              hasBackButton,
              networkHelpScreen: {
                content: screenContent,
                options: {
                  dialogHeaderProps: {
                    density: "expanded",
                    title: t("receiveAddress.networkHelp.title"),
                  },
                  hasBackButton: false,
                  // Aligned with the title, as in the design: the steps' lists use their own inset.
                  dialogBodyProps: { className: "px-24!" },
                },
              },
            })}
          />
        );
      }}
    </ModularDialogFlow>
  );
};

export default ModularDialogFlowManager;
