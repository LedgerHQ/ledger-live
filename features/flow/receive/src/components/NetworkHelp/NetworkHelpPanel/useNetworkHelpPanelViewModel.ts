import { useCallback } from "react";
import { getCurrentTrackingPage, track } from "@shared/analytics";
import { useTranslation } from "@shared/i18n";
import { useOpenLink, useUrlLocalizer } from "@shared/linking";
import { RECEIVE_URLS } from "../../../urls";
import type { NetworkHelpPanelViewProps } from "./NetworkHelpPanelView.types";

export function useNetworkHelpPanelViewModel(): NetworkHelpPanelViewProps {
  const { t } = useTranslation();
  const openLink = useOpenLink();
  const localizeUrl = useUrlLocalizer();

  const onOpenFaq = useCallback(() => {
    track("button_clicked", { button: "FAQ", page: getCurrentTrackingPage() });
    openLink(localizeUrl(RECEIVE_URLS.receiveFromExchange));
  }, [openLink, localizeUrl]);

  return {
    choose: t("receiveAddress.networkHelp.choose"),
    testAmount: t("receiveAddress.networkHelp.testAmount"),
    onOpenFaq,
  };
}
