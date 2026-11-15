import { useCallback } from "react";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useOsUpdateTracking } from "../../analytics/TrackingProvider";
import { OsUpdateButton } from "../../analytics/types";

export function useUnexpectedErrorContentViewModel() {
  const supportUrl = useLocalizedUrl(urls.contact);
  const { trackClick } = useOsUpdateTracking();
  const onPressSupport = useCallback(() => {
    trackClick(OsUpdateButton.LEDGER_SUPPORT);
    Linking.openURL(supportUrl);
  }, [trackClick, supportUrl]);

  return { onPressSupport };
}
