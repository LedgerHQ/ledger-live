import React, { useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogBody } from "@ledgerhq/lumen-ui-react";
import { useSendFlowNavigation, useSendFlowData } from "../context/SendFlowContext";
import type { StepRegistry, StepRenderer } from "../../FlowWizard/types";
import { FLOW_STATUS } from "../../FlowWizard/types";
import type { SendFlowStep } from "../types";
import { SendHeader } from "./SendHeader";

type SendFlowLayoutProps = Readonly<{
  stepRegistry: StepRegistry<SendFlowStep>;
  isOpen: boolean;
  onClose: () => void;
}>;

export function SendFlowLayout({ stepRegistry, isOpen, onClose }: SendFlowLayoutProps) {
  const { currentStep, direction, currentStepConfig } = useSendFlowNavigation();
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

  const animationClass = direction === "FORWARD" ? "animate-fade-in" : "animate-fade-out";
  const dialogHeight = currentStepConfig?.height ?? "fixed";

  const statusGradientClass = useMemo(() => {
    if (state.flowStatus === FLOW_STATUS.ERROR) {
      return "bg-gradient-error";
    }
    if (state.flowStatus === FLOW_STATUS.SUCCESS) {
      return "bg-gradient-success";
    }
    return null;
  }, [state.flowStatus]);

  return (
    <Dialog height={dialogHeight} open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        {statusGradientClass && (
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-full ${statusGradientClass}`}
          />
        )}
        <SendHeader />
        <DialogBody className="-mb-24 basis-0 gap-32 px-24 py-16 text-base [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {StepComponent && (
            <div key={currentStep} className={animationClass}>
              <StepComponent />
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
