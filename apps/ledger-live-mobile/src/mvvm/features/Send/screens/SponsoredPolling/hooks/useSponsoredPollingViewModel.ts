import { useSponsoredPollingElapsed } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredPollingElapsed";
import { useTranslation } from "~/context/Locale";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type SponsoredPollingViewModel = Readonly<{
  title: string;
  message: string;
  elapsedLabel: string;
}>;

/** Shows the elapsed time while the provider delivers the rented energy. */
export function useSponsoredPollingViewModel(): SponsoredPollingViewModel {
  const { t } = useTranslation();
  const { state } = useSponsoredSend();
  const elapsed = useSponsoredPollingElapsed(state.phase);

  return {
    title: t("send.newSendFlow.sponsoredPolling.title"),
    message: t("send.newSendFlow.sponsoredPolling.waiting"),
    elapsedLabel: t("send.newSendFlow.sponsoredPolling.elapsed", { time: elapsed }),
  };
}
