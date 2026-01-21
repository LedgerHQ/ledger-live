import React, { useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogBody } from "@ledgerhq/lumen-ui-react";
import { useSendFlowNavigation, useSendFlowData } from "../context/SendFlowContext";
import type { StepRegistry, StepRenderer } from "../../FlowWizard/types";
import { FLOW_STATUS } from "../../FlowWizard/types";
import type { SendFlowStep } from "../types";
import { SendHeader } from "./SendHeader";
import { cn } from "LLD/utils/cn";

type SendFlowLayoutProps = Readonly<{
  stepRegistry: StepRegistry<SendFlowStep>;
  isOpen: boolean;
  onClose: () => void;
}>;

export function SendFlowLayout({ stepRegistry, isOpen, onClose }: SendFlowLayoutProps) {
  const { currentStep, currentStepConfig } = useSendFlowNavigation();
  const { state } = useSendFlowData();

  const StepComponent = useMemo<StepRenderer | null>(() => {
    const renderer = stepRegistry[currentStep];
    return renderer ?? null;
  }, [currentStep, stepRegistry]);

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
            <div key={currentStep} className="animate-fade-in">
              <StepComponent />
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
