import React, { useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogBody } from "@ledgerhq/lumen-ui-react";
import { useSendFlowNavigation, useSendFlowData } from "../context/SendFlowContext";
import type { StepRenderer, StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
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
      <DialogContent>
        {shouldShowStatusGradient && (
          <div
            className={cn("pointer-events-none absolute inset-x-0 top-0 h-full", {
              "bg-gradient-error": state.flowStatus === FLOW_STATUS.ERROR,
              "bg-gradient-success": state.flowStatus === FLOW_STATUS.SUCCESS,
            })}
          />
        )}
        <SendHeader />
        <DialogBody className="-mb-24 gap-32 px-24 py-16 text-base [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
