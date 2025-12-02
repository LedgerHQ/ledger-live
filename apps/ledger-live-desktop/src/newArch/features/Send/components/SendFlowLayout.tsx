import React, { useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogBody } from "@ledgerhq/lumen-ui-react";
import { useSendFlowContext } from "../context/SendFlowContext";
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
  const { currentStep, direction, currentStepConfig, state } = useSendFlowContext();

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
  const dialogHeight = currentStepConfig?.height ? "hug" : "fixed";

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
    <Dialog
      height={dialogHeight}
      open={isOpen}
      onOpenChange={handleDialogOpenChange}
      {...(currentStepConfig?.height ? { maxHeight: currentStepConfig.height } : {})}
    >
      <DialogContent>
        <SendHeader />
        <DialogBody className="relative mb-0 gap-32 px-24 text-base [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusGradientClass && (
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-full ${statusGradientClass}`}
            />
          )}
          {StepComponent && (
            <div key={currentStep} className={`min-h-0 flex-1 ${animationClass}`}>
              <StepComponent />
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
