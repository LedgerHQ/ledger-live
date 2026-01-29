import React, { useCallback } from "react";
import { Dialog, DialogContent, DialogBody } from "@ledgerhq/lumen-ui-react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../context/SendFlowContext";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep, SendFlowBusinessContext } from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig } from "../types";
import { SendHeader } from "./SendHeader";
import { cn } from "LLD/utils/cn";

type SendFlowLayoutProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function SendFlowLayout({ isOpen, onClose }: SendFlowLayoutProps) {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state } = useSendFlowData();

  const currentStepConfig = wizard.currentStepConfig as SendStepConfig;
  const StepComponent = wizard.currentStepRenderer;

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const dialogHeight = currentStepConfig?.height ?? "fixed";

  const shouldShowStatusGradient =
    state.flowStatus === FLOW_STATUS.ERROR || state.flowStatus === FLOW_STATUS.SUCCESS;

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
        <SendHeader />
        <DialogBody className="-mb-24 gap-32 px-24 py-16">
          {StepComponent && (
            <div key={wizard.currentStep} className="animate-fade-in">
              <StepComponent />
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
