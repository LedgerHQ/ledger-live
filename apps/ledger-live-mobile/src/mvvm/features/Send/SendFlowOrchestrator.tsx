import React, { useMemo, useCallback } from "react";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import {
  SEND_FLOW_STEP,
  canSkipRecipientStep,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";

import { FlowStackNavigator } from "../FlowWizard/FlowStackNavigator";
import { SendFlowProvider } from "./context/SendFlowContext";
import { RecipientContactSelectionProvider } from "./context/RecipientContactSelectionContext";
import { SendSignatureProvider, useSendSignature } from "./context/SendSignatureContext";
import { SignatureOverlayHost } from "./components/SignatureOverlayHost";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import type { SendStepConfig, SendFlowConfig } from "./types";

type SendFlowOrchestratorProps = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
  stepRegistry: StepRegistry<SendFlowStep>;
  flowConfig: SendFlowConfig;
  children?: React.ReactNode;
}>;

type SendFlowNavigatorProps = Readonly<{
  stepRegistry: StepRegistry<SendFlowStep>;
  flowConfig: SendFlowConfig;
  onClose: () => void;
}>;

function SendFlowNavigator({ stepRegistry, flowConfig, onClose }: SendFlowNavigatorProps) {
  const { isSigning } = useSendSignature();

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
    <FlowStackNavigator<SendFlowStep, SendStepConfig>
      stepRegistry={stepRegistry}
      flowConfig={flowConfig}
      disableBackGesture={isSigning}
      getScreenName={getScreenName}
      getScreenOptions={getScreenOptions}
      onClose={onClose}
    />
  );
}

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
      initialStep: canSkipRecipientStep(initParams, businessContext.uiConfig)
        ? SEND_FLOW_STEP.AMOUNT
        : SEND_FLOW_STEP.RECIPIENT,
    }),
    [businessContext.uiConfig, flowConfig, initParams],
  );

  return (
    <SendFlowProvider value={businessContext} onClose={onClose}>
      <RecipientContactSelectionProvider>
        <SendSignatureProvider>
          <SendFlowNavigator
            stepRegistry={stepRegistry}
            flowConfig={configuredFlowConfig}
            onClose={onClose}
          />
          <SignatureOverlayHost />
          {children}
        </SendSignatureProvider>
      </RecipientContactSelectionProvider>
    </SendFlowProvider>
  );
}
