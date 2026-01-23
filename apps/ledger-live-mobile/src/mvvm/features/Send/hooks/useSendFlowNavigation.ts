import { useFlowWizardNavigation } from "../../FlowWizard/hooks/useFlowWizardNavigation";
import { SEND_FLOW_CONFIG } from "../constants";
import { SEND_FLOW_STEP } from "../types";
import type { SendFlowStep, SendStepConfig } from "../types";

/**
 * Hook to access Send Flow navigation actions using the generic FlowWizard navigation
 * This is a specialized wrapper around useFlowWizardNavigation for Send Flow
 */
export function useSendFlowNavigation() {
  return useFlowWizardNavigation<SendFlowStep, SendStepConfig>({
    flowConfig: SEND_FLOW_CONFIG,
    stepValues: SEND_FLOW_STEP,
    fallbackStep: SEND_FLOW_STEP.RECIPIENT,
  });
}
