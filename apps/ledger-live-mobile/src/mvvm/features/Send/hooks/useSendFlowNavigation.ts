import { useFlowWizardNavigation } from "../../FlowWizard/hooks/useFlowWizardNavigation";
import { SEND_FLOW_CONFIG } from "../constants";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig } from "../types";

export function useSendFlowNavigation() {
  return useFlowWizardNavigation<SendFlowStep, SendStepConfig>({
    flowConfig: SEND_FLOW_CONFIG,
    stepValues: SEND_FLOW_STEP,
    fallbackStep: SEND_FLOW_STEP.RECIPIENT,
  });
}
