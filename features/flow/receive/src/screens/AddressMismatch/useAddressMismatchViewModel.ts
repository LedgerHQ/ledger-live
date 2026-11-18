import { useCallback } from "react";
import { track } from "@shared/analytics";
import { useTranslation } from "@shared/i18n";
import { VERIFICATION_PAGE } from "../../logic/verificationPage";
import type { AddressMismatchProps } from "./AddressMismatch.types";
import type { AddressMismatchViewProps } from "./AddressMismatchView.types";

export function useAddressMismatchViewModel({
  onContactSupport,
  onClose,
}: AddressMismatchProps): AddressMismatchViewProps {
  const { t } = useTranslation();

  const trackAndContactSupport = useCallback(
    function trackAndContactSupport() {
      track("button_clicked", { button: "Contact Ledger Support", ...VERIFICATION_PAGE });
      onContactSupport();
    },
    [onContactSupport],
  );

  const trackAndClose = useCallback(
    function trackAndClose() {
      track("button_clicked", { button: "Close", ...VERIFICATION_PAGE });
      onClose();
    },
    [onClose],
  );

  return {
    title: t("receiveAddress.addressMismatch.title"),
    description: t("receiveAddress.addressMismatch.description"),
    contactSupportLabel: t("receiveAddress.addressMismatch.contactSupportCta"),
    closeLabel: t("receiveAddress.addressMismatch.closeCta"),
    onContactSupport: trackAndContactSupport,
    onClose: trackAndClose,
  };
}
