import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type SponsoredPollingViewModel = Readonly<{
  waitingLabel: string;
  elapsedLabel: string;
}>;

/**
 * View model for the floating SPONSORED_POLLING step: a pure view over the shared orchestration's
 * `state.phase` while Tronify delivers the rented energy. Starts no orchestration of its own --
 * the polling itself runs inside useSponsoredSendOrchestration, kicked off by
 * SPONSORED_RENT_SIGNATURE's startRentPayment. Navigation away follows the phase (TRANSFER -> the
 * existing SIGNATURE step, where TX-C the real USDT transfer is signed; FAILED -> SPONSORED_FAILURE),
 * guarded the same way as SPONSORED_RENT_SIGNATURE's own phase->navigation effect (lastNavigatedPhaseRef)
 * so a same-phase re-render never re-dispatches.
 */
export function useSponsoredPollingViewModel(): SponsoredPollingViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state } = useSponsoredSend();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (state.phase !== SPONSORED_PHASE.POLLING) return;
    // Restart from 00:00 for each polling cycle: a retry re-enters POLLING, and without this reset
    // the counter would keep the previous attempt's elapsed time and show a cumulative total.
    setElapsedSeconds(0);
    const intervalId = setInterval(() => {
      setElapsedSeconds(previous => previous + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [state.phase]);

  const lastNavigatedPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.phase === lastNavigatedPhaseRef.current) return;
    if (state.phase === SPONSORED_PHASE.TRANSFER) {
      lastNavigatedPhaseRef.current = state.phase;
      navigation.goToStep(SEND_FLOW_STEP.SIGNATURE);
    } else if (state.phase === SPONSORED_PHASE.FAILED) {
      lastNavigatedPhaseRef.current = state.phase;
      navigation.goToStep(SEND_FLOW_STEP.SPONSORED_FAILURE);
    }
  }, [state.phase, navigation]);

  return {
    waitingLabel: t("newSendFlow.sponsoredPolling.waiting"),
    elapsedLabel: t("newSendFlow.sponsoredPolling.elapsed", {
      time: formatElapsed(elapsedSeconds),
    }),
  };
}
