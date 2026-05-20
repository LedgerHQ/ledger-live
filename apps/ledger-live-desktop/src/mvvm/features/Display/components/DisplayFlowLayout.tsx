import React, { useCallback } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DISPLAY_FLOW_STEP, type DisplayFlowStep } from "@ledgerhq/live-common/flows/display/types";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useDisplayFlowData } from "../context/DisplayFlowContext";
import type { DisplayFlowBusinessContext, DisplayStepConfig } from "../types";

type DisplayFlowLayoutProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

/**
 * DisplayFlowLayout
 *
 * Visual shell of the Display POC dialog. Owns:
 * - the Dialog open/close behavior
 * - the header (title + back button)
 * - the current step component (resolved via the FlowWizard step registry)
 * - the footer with Next/Close actions
 *
 * The layout never branches on coin family — it only reads from `uiConfig`
 * (descriptor-driven) and from the wizard navigation state.
 */
export function DisplayFlowLayout({ isOpen, onClose }: DisplayFlowLayoutProps) {
  const wizard = useFlowWizard<DisplayFlowStep, DisplayFlowBusinessContext, DisplayStepConfig>();
  const { uiConfig } = useDisplayFlowData();

  const StepComponent = wizard.currentStepRenderer;
  const currentStepConfig = wizard.currentStepConfig;

  const isTokensStep = wizard.currentStep === DISPLAY_FLOW_STEP.TOKENS;
  const isLastVisibleStep = uiConfig.hasTokens
    ? isTokensStep
    : wizard.currentStep === DISPLAY_FLOW_STEP.TRANSACTIONS;

  const handleNext = useCallback(() => {
    if (isLastVisibleStep) {
      onClose();
      return;
    }
    wizard.navigation.goToNextStep();
  }, [isLastVisibleStep, onClose, wizard.navigation]);

  const handleBack = useCallback(() => {
    wizard.navigation.goToPreviousStep();
  }, [wizard.navigation]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog height="fit" open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="text-base">
        <DialogHeader
          density="compact"
          title={currentStepConfig?.titleKey ?? ""}
          onBack={currentStepConfig?.canGoBack ? handleBack : undefined}
          onClose={onClose}
        />
        {StepComponent && (
          <div className="flex animate-fade-in flex-col px-24 py-16">
            <StepComponent />
          </div>
        )}
        <DialogFooter className="px-24">
          <Button appearance="base" size="lg" isFull onClick={handleNext}>
            {isLastVisibleStep ? "Close" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
