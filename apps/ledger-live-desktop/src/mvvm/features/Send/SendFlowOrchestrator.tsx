import React, { useMemo, type ReactNode } from "react";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { SendFlowProvider } from "./context/SendFlowContext";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import { SEND_FLOW_CONFIG } from "./constants";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { SendFlowStep, SendFlowInitParams } from "@ledgerhq/live-common/flows/send/types";
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
      initialStep: SEND_FLOW_STEP.RECIPIENT,
    }),
    [],
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
