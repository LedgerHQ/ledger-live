import React, { useCallback, useMemo } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../context/SendFlowContext";
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

type SendFlowLayoutProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function SendFlowLayout({ isOpen, onClose }: SendFlowLayoutProps) {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig } = useSendFlowData();

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
          page: `step ${wizard.currentStep}`,
          ...sendFlowTrackingProperties,
        });
        onClose();
      }
    },
    [onClose, wizard.currentStep, sendFlowTrackingProperties],
  );

  const hasAmountPlugins =
    wizard.currentStep === SEND_FLOW_STEP.AMOUNT && uiConfig.hasAmountPlugins;

  const dialogHeight = hasAmountPlugins ? "fixed" : (currentStepConfig?.height ?? "fixed");

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
      </DialogContent>
    </Dialog>
  );
}
