import React, { useCallback, useMemo } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../context/SendFlowContext";
import { RecipientScannerProvider } from "../context/RecipientScannerContext";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowBusinessContext,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig } from "../types";
import { SendHeader } from "./SendHeader";
import { AnimatedHeight } from "./AnimatedHeight";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { useRecipientContactSelection } from "../context/RecipientContactSelectionContext";
import { useSendFlowTracking } from "../context/SendFlowTrackingContext";
import { getSendFlowTrackingPage } from "../utils/contactTracking";

type SendFlowLayoutProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function SendFlowLayout({ isOpen, onClose }: SendFlowLayoutProps) {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state } = useSendFlowData();
  const { recipientType } = useSendFlowTracking();
  const { selectedContact } = useRecipientContactSelection();
  const isSelectingContactAddress =
    wizard.currentStep === SEND_FLOW_STEP.RECIPIENT && selectedContact !== undefined;

  const currentStepConfig = wizard.currentStepConfig;
  const StepComponent = wizard.currentStepRenderer;
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        track("button_clicked", {
          button: "close",
          page: getSendFlowTrackingPage(wizard.currentStep, isSelectingContactAddress),
          recipientType,
          ...sendFlowTrackingProperties,
        });
        onClose();
      }
    },
    [
      isSelectingContactAddress,
      onClose,
      recipientType,
      wizard.currentStep,
      sendFlowTrackingProperties,
    ],
  );

  const dialogHeight = currentStepConfig?.height ?? "fixed";

  const shouldShowStatusGradient =
    state.flowStatus === FLOW_STATUS.ERROR || state.flowStatus === FLOW_STATUS.SUCCESS;
  const shouldAnimateHeight = dialogHeight === "fit";

  return (
    <Dialog height={dialogHeight} open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="text-base">
        {shouldShowStatusGradient && (
          <div
            className={cn("pointer-events-none absolute inset-x-0 top-0 h-full", {
              "bg-gradient-error": state.flowStatus === FLOW_STATUS.ERROR,
              "bg-gradient-success": state.flowStatus === FLOW_STATUS.SUCCESS,
            })}
          />
        )}
        <RecipientScannerProvider>
          {shouldAnimateHeight ? (
            <AnimatedHeight>
              <div className="flex flex-col">
                <SendHeader />
                {StepComponent && (
                  <div key={wizard.currentStep} className="flex animate-fade-in flex-col">
                    <StepComponent />
                  </div>
                )}
              </div>
            </AnimatedHeight>
          ) : (
            <>
              <SendHeader />
              {StepComponent && (
                <div
                  key={wizard.currentStep}
                  className="flex min-h-0 flex-1 animate-fade-in flex-col"
                >
                  <StepComponent />
                </div>
              )}
            </>
          )}
        </RecipientScannerProvider>
      </DialogContent>
    </Dialog>
  );
}
