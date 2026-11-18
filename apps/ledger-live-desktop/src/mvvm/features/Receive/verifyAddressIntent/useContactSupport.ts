import { useCallback } from "react";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

/** Opens Ledger Support, from the address mismatch warning. */
export function useContactSupport() {
  const contactSupportUrl = useLocalizedUrl(urls.contactSupport);
  return useCallback(() => openURL(contactSupportUrl), [contactSupportUrl]);
}
