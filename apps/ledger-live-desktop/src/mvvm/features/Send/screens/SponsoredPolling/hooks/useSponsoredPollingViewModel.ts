import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
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
 * SPONSORED_RENT_SIGNATURE's startRentPayment. Navigation away (TRANSFER -> the existing SIGNATURE
 * step where TX-C the real USDT transfer is signed; FAILED -> SPONSORED_FAILURE) is driven by the
 * shared useSponsoredPhaseNavigator, not this screen.
 */
export function useSponsoredPollingViewModel(): SponsoredPollingViewModel {
  const { t } = useTranslation();
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

  return {
    waitingLabel: t("newSendFlow.sponsoredPolling.waiting"),
    elapsedLabel: t("newSendFlow.sponsoredPolling.elapsed", {
      time: formatElapsed(elapsedSeconds),
    }),
  };
}
