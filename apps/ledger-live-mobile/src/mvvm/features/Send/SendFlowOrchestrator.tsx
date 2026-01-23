import React, { useMemo, type ReactNode } from "react";
import type { StepRegistry } from "../FlowWizard/types";
import { useFlowWizardOrchestrator } from "../FlowWizard/hooks";
import { SendFlowProvider } from "./context/SendFlowContext";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import { SEND_FLOW_CONFIG } from "./constants";
import { SEND_FLOW_STEP } from "./types";
import type {
  SendFlowStep,
  SendFlowInitParams,
  SendStepConfig,
  SendFlowContextValue,
} from "./types";

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
  stepRegistry: _stepRegistry,
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

  const { state, actions, currentStepConfig } = useFlowWizardOrchestrator<
    SendFlowStep,
    SendStepConfig
  >({
    flowConfig,
  });

  const contextValue = useMemo<SendFlowContextValue>(
    () => ({
      ...businessContext,
      navigation: actions,
      currentStep: state.currentStep,
      direction: state.direction,
      currentStepConfig,
    }),
    [businessContext, actions, state.currentStep, state.direction, currentStepConfig],
  );

  return <SendFlowProvider value={contextValue}>{children}</SendFlowProvider>;
}
