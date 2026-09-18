import { useEffect, useRef } from "react";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSponsoredSend } from "../context/SponsoredSendContext";

// The single phase -> step map for the two-signature sponsored send. Each phase that has a screen
// advances to it; IDLE and DONE are absent on purpose — IDLE is entered from AMOUNT's Review button,
// and DONE hands back to the shared SIGNATURE screen's own goToNextStep for the confirmation.
// TRANSFER -> SIGNATURE covers both routes into the transfer: via POLLING, and the direct
// RENT_SIGNING -> TRANSFER jump when a submit rejection reconciles to "already delivered" (no
// POLLING_START), which would otherwise strand a paid+delivered order on the rent-signature step.
const PHASE_TO_STEP: Partial<Record<SponsoredPhase, SendFlowStep>> = {
  [SPONSORED_PHASE.RENT_SIGNING]: SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE,
  [SPONSORED_PHASE.POLLING]: SEND_FLOW_STEP.SPONSORED_POLLING,
  [SPONSORED_PHASE.TRANSFER]: SEND_FLOW_STEP.SIGNATURE,
  [SPONSORED_PHASE.FAILED]: SEND_FLOW_STEP.SPONSORED_FAILURE,
};

/**
 * Drives step navigation from the sponsored orchestration's `state.phase`, mounted once at the send
 * layout so it owns the whole phase -> step contract instead of each screen encoding its own slice.
 * A single guard ref suppresses a re-navigate on an unchanged phase; every real transition (including
 * a retry cycling back to RENT_SIGNING/TRANSFER) changes the phase, so it re-fires correctly. Inert
 * for an ordinary send, which never leaves IDLE.
 */
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
