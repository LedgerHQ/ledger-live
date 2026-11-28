import { useCallback } from "react";
import { track } from "@shared/analytics";
import { useTranslation } from "@shared/i18n";
import type { AddressDisplayedProps } from "./AddressDisplayed.types";
import type { AddressDisplayedViewProps } from "./AddressDisplayedView.types";

export function useAddressDisplayedViewModel({
  onGotIt,
}: AddressDisplayedProps): AddressDisplayedViewProps {
  const { t } = useTranslation();

  const trackAndGoBack = useCallback(
    function trackAndGoBack() {
      track("button_clicked", {
        button: "Got it",
        page: "Receive Address Verification",
        flow: "receive",
      });
      onGotIt();
    },
    [onGotIt],
  );

  return {
    title: t("receiveAddress.addressDisplayed.title"),
    description: t("receiveAddress.addressDisplayed.description"),
    gotItLabel: t("receiveAddress.addressDisplayed.gotItCta"),
    onGotIt: trackAndGoBack,
  };
}
