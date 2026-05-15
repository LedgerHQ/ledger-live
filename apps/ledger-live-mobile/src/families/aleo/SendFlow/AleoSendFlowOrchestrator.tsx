import React, { useMemo } from "react";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import type { SendFlowConfig, SendStepConfig } from "~/mvvm/features/Send/types";

import { SendFlowOrchestrator } from "~/mvvm/features/Send/SendFlowOrchestrator";
import { AleoRecipientScreen } from "./screens/AleoRecipientScreen";
import { AleoAmountScreen } from "./screens/AleoAmountScreen";
import { AleoPrivateSyncScreen } from "./screens/AleoPrivateSyncScreen";
import { ConfirmationScreen } from "~/mvvm/features/Send/screens/Confirmation";
import { SignatureScreen } from "~/mvvm/features/Send/screens/Signature";
import { CoinControlScreen } from "~/mvvm/features/Send/screens/CoinControl";

// Custom step for Aleo private sync
const ALEO_PRIVATE_SYNC = "ALEO_PRIVATE_SYNC" as SendFlowStep;

const aleoStepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: AleoRecipientScreen,
  [ALEO_PRIVATE_SYNC]: AleoPrivateSyncScreen,
  [SEND_FLOW_STEP.AMOUNT]: AleoAmountScreen,
  [SEND_FLOW_STEP.RECENT_HISTORY]: () => <></>,
  [SEND_FLOW_STEP.CUSTOM_FEES]: () => <></>,
  [SEND_FLOW_STEP.COIN_CONTROL]: CoinControlScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
};

const ALEO_SEND_STEP_ORDER: readonly SendFlowStep[] = [
  SEND_FLOW_STEP.RECIPIENT,
  ALEO_PRIVATE_SYNC,
  SEND_FLOW_STEP.AMOUNT,
  SEND_FLOW_STEP.COIN_CONTROL,
  SEND_FLOW_STEP.SIGNATURE,
  SEND_FLOW_STEP.CONFIRMATION,
];

const ALEO_SEND_STEP_CONFIGS: Record<SendFlowStep, SendStepConfig> = {
  [SEND_FLOW_STEP.RECIPIENT]: {
    id: SEND_FLOW_STEP.RECIPIENT,
    canGoBack: false,
    showTitle: true,
    showHeaderRight: true,
  },
  [ALEO_PRIVATE_SYNC]: {
    id: ALEO_PRIVATE_SYNC,
    canGoBack: true,
    showTitle: true,
    showHeaderRight: true,
    // Exclude from breadcrumb navigation
  },
  [SEND_FLOW_STEP.AMOUNT]: {
    id: SEND_FLOW_STEP.AMOUNT,
    canGoBack: true,
    showTitle: true,
    showHeaderRight: true,
  },
  [SEND_FLOW_STEP.RECENT_HISTORY]: {
    id: SEND_FLOW_STEP.RECENT_HISTORY,
    canGoBack: true,
    showTitle: false,
    showHeaderRight: false,
  },
  [SEND_FLOW_STEP.CUSTOM_FEES]: {
    id: SEND_FLOW_STEP.CUSTOM_FEES,
    canGoBack: true,
    showTitle: true,
    showHeaderRight: true,
  },
  [SEND_FLOW_STEP.COIN_CONTROL]: {
    id: SEND_FLOW_STEP.COIN_CONTROL,
    canGoBack: true,
    showTitle: true,
    showHeaderRight: true,
  },
  [SEND_FLOW_STEP.SIGNATURE]: {
    id: SEND_FLOW_STEP.SIGNATURE,
    canGoBack: true,
    showTitle: true,
    showHeaderRight: true,
  },
  [SEND_FLOW_STEP.CONFIRMATION]: {
    id: SEND_FLOW_STEP.CONFIRMATION,
    canGoBack: false,
    showTitle: true,
    showHeaderRight: true,
  },
};

const aleoFlowConfig: SendFlowConfig = {
  stepOrder: ALEO_SEND_STEP_ORDER,
  stepConfigs: ALEO_SEND_STEP_CONFIGS,
};

type AleoSendFlowOrchestratorProps = {
  initParams: SendFlowInitParams;
  onClose: () => void;
};

export function AleoSendFlowOrchestrator({ initParams, onClose }: AleoSendFlowOrchestratorProps) {
  return (
    <SendFlowOrchestrator
      initParams={initParams}
      onClose={onClose}
      stepRegistry={aleoStepRegistry}
      flowConfig={aleoFlowConfig}
    />
  );
}
