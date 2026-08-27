import React, { useMemo, type ReactNode } from "react";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { SendFlowProvider } from "./context/SendFlowContext";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import { SEND_FLOW_CONFIG } from "./constants";
import {
  canSkipRecipientStep,
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig as DesktopSendStepConfig } from "./types";
import { FlowWizardOrchestrator } from "../FlowWizard/FlowWizardOrchestrator";

type SendFlowStepRegistry = StepRegistry<SendFlowStep>;

type SendFlowOrchestratorProps = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
  stepRegistry: SendFlowStepRegistry;
  children?: ReactNode;
}>;

export function SendFlowOrchestrator({
  initParams,
  onClose,
  stepRegistry,
  children,
}: SendFlowOrchestratorProps) {
  const businessContext = useSendFlowBusinessLogic({ initParams, onClose });
  const flowConfig = useMemo(
    () => ({
      ...SEND_FLOW_CONFIG,
      initialStep: canSkipRecipientStep(initParams, businessContext.uiConfig)
        ? SEND_FLOW_STEP.AMOUNT
        : SEND_FLOW_STEP.RECIPIENT,
    }),
    [businessContext.uiConfig, initParams],
  );

  return (
    <FlowWizardOrchestrator<SendFlowStep, typeof businessContext, DesktopSendStepConfig>
      flowConfig={flowConfig}
      stepRegistry={stepRegistry}
      contextValue={businessContext}
      ContextProvider={SendFlowProvider}
    >
      {children}
    </FlowWizardOrchestrator>
  );
}
