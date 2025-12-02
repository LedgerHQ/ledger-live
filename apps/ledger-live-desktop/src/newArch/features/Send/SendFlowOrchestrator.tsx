import React, { useMemo, type ReactNode } from "react";
import { FlowWizardOrchestrator } from "../FlowWizard/FlowWizardOrchestrator";
import type { StepRegistry, AnimationConfig, FlowWizardContextValue } from "../FlowWizard/types";
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

type SendFlowStepRegistry = StepRegistry<SendFlowStep>;
type SendFlowWizardContext = FlowWizardContextValue<
  SendFlowStep,
  SendFlowBusinessContext,
  SendStepConfig
>;

type SendFlowOrchestratorProps = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
  stepRegistry: SendFlowStepRegistry;
  animationConfig?: AnimationConfig;
  children?: ReactNode;
}>;

type SendFlowProviderWrapperProps = Readonly<{
  value: SendFlowWizardContext;
  children: ReactNode;
}>;

// Adapter that injects the Send context into the generic FlowWizard orchestrator
function SendFlowProviderWrapper({ value, children }: SendFlowProviderWrapperProps) {
  return <SendFlowProvider value={value}>{children}</SendFlowProvider>;
}

export function SendFlowOrchestrator({
  initParams,
  onClose,
  stepRegistry,
  animationConfig,
  children,
}: SendFlowOrchestratorProps) {
  const skipAccountSelection = Boolean(initParams?.account) || Boolean(initParams?.fromMAD);
  const businessContext = useSendFlowBusinessLogic({ initParams, onClose });
  const flowConfig = useMemo(
    () => ({
      ...SEND_FLOW_CONFIG,
      initialStep: skipAccountSelection
        ? SEND_FLOW_STEP.RECIPIENT
        : SEND_FLOW_STEP.ACCOUNT_SELECTION,
    }),
    [skipAccountSelection],
  );

  // Bridge the generic wizard runner with Send-specific business state and config
  return (
    <FlowWizardOrchestrator<SendFlowStep, SendFlowBusinessContext, SendStepConfig>
      flowConfig={flowConfig}
      stepRegistry={stepRegistry}
      contextValue={businessContext}
      ContextProvider={SendFlowProviderWrapper}
      animationConfig={animationConfig}
      getContainerStyle={stepConfig =>
        stepConfig.sizeDialog ? { height: `${stepConfig.sizeDialog}px` } : { height: "612px" }
      }
    >
      {children}
    </FlowWizardOrchestrator>
  );
}
