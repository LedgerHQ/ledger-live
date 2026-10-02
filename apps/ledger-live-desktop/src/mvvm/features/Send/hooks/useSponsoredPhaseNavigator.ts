import { useEffect, useRef } from "react";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSponsoredSend } from "../context/SponsoredSendContext";

// No IDLE/DONE: AMOUNT's Review leaves IDLE, and SIGNATURE's own goToNextStep handles DONE.
const PHASE_TO_STEP: Partial<Record<SponsoredPhase, SendFlowStep>> = {
  [SPONSORED_PHASE.RENT_SIGNING]: SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE,
  [SPONSORED_PHASE.POLLING]: SEND_FLOW_STEP.SPONSORED_POLLING,
  [SPONSORED_PHASE.TRANSFER]: SEND_FLOW_STEP.SIGNATURE,
  [SPONSORED_PHASE.FAILED]: SEND_FLOW_STEP.SPONSORED_FAILURE,
};

export function useSponsoredPhaseNavigator(): void {
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state } = useSponsoredSend();
  const phase = state.phase;

  const lastNavigatedPhaseRef = useRef<SponsoredPhase | null>(null);
  useEffect(() => {
    if (phase === lastNavigatedPhaseRef.current) return;
    const step = PHASE_TO_STEP[phase];
    if (!step) return;
    lastNavigatedPhaseRef.current = phase;
    navigation.goToStep(step);
  }, [phase, navigation]);
}
