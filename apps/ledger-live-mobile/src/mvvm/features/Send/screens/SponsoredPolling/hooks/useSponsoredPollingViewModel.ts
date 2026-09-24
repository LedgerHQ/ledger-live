import { useEffect, useState } from "react";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type SponsoredPollingViewModel = Readonly<{
  elapsedLabel: string;
}>;

/**
 * View model for the SPONSORED_POLLING overlay: shows elapsed time while Tronify delivers
 * the rented energy. The orchestration in useSponsoredSendOrchestration drives phase transitions
 * (POLLING → TRANSFER or FAILED); SponsoredFlowHost reacts to phase and unmounts this screen.
 */
export function useSponsoredPollingViewModel(): SponsoredPollingViewModel {
  const { state } = useSponsoredSend();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (state.phase !== SPONSORED_PHASE.POLLING) return;
    setElapsedSeconds(0);
    const intervalId = setInterval(() => {
      setElapsedSeconds(previous => previous + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [state.phase]);

  return {
    elapsedLabel: formatElapsed(elapsedSeconds),
  };
}
