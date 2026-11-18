import { useCallback } from "react";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

/** Opens Ledger Support, from the address mismatch warning. */
export function useContactSupport() {
  const contactSupportUrl = useLocalizedUrl(urls.contact);
  return useCallback(() => {
    void Linking.openURL(contactSupportUrl);
  }, [contactSupportUrl]);
}
