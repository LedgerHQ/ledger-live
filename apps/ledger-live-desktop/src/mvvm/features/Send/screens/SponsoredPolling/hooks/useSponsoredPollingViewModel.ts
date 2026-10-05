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
  title: string;
  waitingLabel: string;
  elapsedLabel: string;
}>;

export function useSponsoredPollingViewModel(): SponsoredPollingViewModel {
  const { t } = useTranslation();
  const { state, providerName } = useSponsoredSend();

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
    title: t("newSendFlow.sponsoredPolling.title"),
    waitingLabel: t("newSendFlow.sponsoredPolling.waiting", { provider: providerName }),
    elapsedLabel: t("newSendFlow.sponsoredPolling.elapsed", {
      time: formatElapsed(elapsedSeconds),
    }),
  };
}
