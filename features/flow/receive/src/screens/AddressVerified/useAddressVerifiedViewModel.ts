import { useCallback } from "react";
import { track } from "@shared/analytics";
import { useTranslation } from "@shared/i18n";
import type { AddressVerifiedProps } from "./AddressVerified.types";
import type { AddressVerifiedViewProps } from "./AddressVerifiedView.types";

export function useAddressVerifiedViewModel({
  onDone,
}: AddressVerifiedProps): AddressVerifiedViewProps {
  const { t } = useTranslation();

  const trackAndFinish = useCallback(
    function trackAndFinish() {
      track("button_clicked", {
        button: "Done",
        page: "Receive Address Verification",
        flow: "receive",
      });
      onDone();
    },
    [onDone],
  );

  return {
    title: t("receiveAddress.addressVerified.title"),
    description: t("receiveAddress.addressVerified.description"),
    doneLabel: t("receiveAddress.addressVerified.doneCta"),
    onDone: trackAndFinish,
  };
}
