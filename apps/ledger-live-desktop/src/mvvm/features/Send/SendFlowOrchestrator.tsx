import React, { useMemo, type ReactNode } from "react";
import type { StepRegistry, FlowWizardContextValue } from "../FlowWizard/types";
import { SendFlowProvider } from "./context/SendFlowContext";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import { SEND_FLOW_CONFIG } from "./constants";
import { SEND_FLOW_STEP } from "./types";
import type {
  SendFlowStep,
  SendFlowInitParams,
  SendFlowBusinessContext,
  SendStepConfig,
} from "./types";
import { useFlowWizardNavigation } from "../FlowWizard/hooks/useFlowWizardNavigation";

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

  const { state, actions, currentStepConfig } = useFlowWizardNavigation<
    SendFlowStep,
    SendStepConfig
  >({
    flowConfig,
  });

  const contextValue = useMemo<
    FlowWizardContextValue<SendFlowStep, SendFlowBusinessContext, SendStepConfig>
  >(
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
