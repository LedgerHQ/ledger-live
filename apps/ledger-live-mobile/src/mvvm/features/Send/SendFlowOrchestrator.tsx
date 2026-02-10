import React, { useMemo, useCallback } from "react";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";

import { FlowStackNavigator } from "../FlowWizard/FlowStackNavigator";
import { SendFlowProvider } from "./context/SendFlowContext";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import type { SendStepConfig, SendFlowConfig } from "./types";

type SendFlowOrchestratorProps = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
  stepRegistry: StepRegistry<SendFlowStep>;
  flowConfig: SendFlowConfig;
  children?: React.ReactNode;
}>;

export function SendFlowOrchestrator({
  initParams,
  onClose,
  stepRegistry,
  flowConfig,
  children,
}: SendFlowOrchestratorProps) {
  const businessContext = useSendFlowBusinessLogic({ initParams, onClose });

  const configuredFlowConfig = useMemo(
    () => ({
      ...flowConfig,
      initialStep: SEND_FLOW_STEP.RECIPIENT,
    }),
    [flowConfig],
  );

  const getScreenName = useCallback(
    (step: SendFlowStep) => {
      const stepConfig = flowConfig.stepConfigs[step];
      return stepConfig?.screenName ?? `SendFlow${step}`;
    },
    [flowConfig.stepConfigs],
  );

  const getScreenOptions = useCallback((_step: SendFlowStep, config: SendStepConfig) => {
    return config?.screenOptions ?? {};
  }, []);

  return (
    <SendFlowProvider value={businessContext} onClose={onClose}>
      <FlowStackNavigator<SendFlowStep, SendStepConfig>
        stepRegistry={stepRegistry}
        flowConfig={configuredFlowConfig}
        getScreenName={getScreenName}
        getScreenOptions={getScreenOptions}
        onClose={onClose}
      />
      {children}
    </SendFlowProvider>
  );
}
