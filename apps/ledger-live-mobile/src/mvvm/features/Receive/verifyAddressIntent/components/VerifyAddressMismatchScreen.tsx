import React, { useCallback } from "react";
import { Linking } from "react-native";
import { AddressMismatch } from "@features/flow-receive";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

export function VerifyAddressMismatchScreen({ onClose }: Readonly<{ onClose: () => void }>) {
  const contactSupportUrl = useLocalizedUrl(urls.contact);
  const openSupport = useCallback(() => {
    Linking.openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return <AddressMismatch onContactSupport={openSupport} onClose={onClose} />;
}
