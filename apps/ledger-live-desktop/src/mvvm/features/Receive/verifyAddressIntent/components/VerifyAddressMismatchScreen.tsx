import React, { useCallback } from "react";
import { AddressMismatch } from "@features/flow-receive";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

export function VerifyAddressMismatchScreen({ onClose }: Readonly<{ onClose: () => void }>) {
  const contactSupportUrl = useLocalizedUrl(urls.contactSupport);
  const openSupport = useCallback(() => {
    openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return <AddressMismatch onContactSupport={openSupport} onClose={onClose} />;
}
