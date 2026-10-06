import { useTranslation } from "react-i18next";
import { useSponsoredPollingElapsed } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredPollingElapsed";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type SponsoredPollingViewModel = Readonly<{
  title: string;
  waitingLabel: string;
  elapsedLabel: string;
}>;

export function useSponsoredPollingViewModel(): SponsoredPollingViewModel {
  const { t } = useTranslation();
  const { state, providerName } = useSponsoredSend();

  const elapsed = useSponsoredPollingElapsed(state.phase);

  return {
    title: t("newSendFlow.sponsoredPolling.title"),
    waitingLabel: t("newSendFlow.sponsoredPolling.waiting", { provider: providerName }),
    elapsedLabel: t("newSendFlow.sponsoredPolling.elapsed", { time: elapsed }),
  };
}
