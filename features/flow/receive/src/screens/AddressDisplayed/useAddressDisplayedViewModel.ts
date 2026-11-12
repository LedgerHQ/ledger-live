import { useCallback } from "react";
import { useTranslation } from "@shared/i18n";
import { track } from "@shared/analytics";
import type { AddressDisplayedProps, AddressDisplayedViewProps } from "../../types";

const KEY_PREFIX = "receiveAddress.addressDisplayed";

export function useAddressDisplayedViewModel({
  onGotIt,
  onClose,
}: AddressDisplayedProps): AddressDisplayedViewProps {
  const { t } = useTranslation();

  const handleGotIt = useCallback(() => {
    void track("button_clicked", {
      button: "Got it",
      page: "Receive Address Verification",
      flow: "receive",
    });
    onGotIt();
  }, [onGotIt]);

  return {
    title: t(`${KEY_PREFIX}.title`),
    description: t(`${KEY_PREFIX}.description`),
    gotItCta: t(`${KEY_PREFIX}.gotItCta`),
    onGotIt: handleGotIt,
    onClose,
  };
}
