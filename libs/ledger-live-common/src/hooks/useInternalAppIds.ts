import { useMemo } from "react";
import { useFeature } from "../featureFlags";
import { INTERNAL_APP_IDS } from "../wallet-api/constants";

/** Returns array of manifest ids for internal apps that can navigate to and from external urls, e.g. the current version of buy sell live app, which requires javaScriptCanOpenWindowsAutomatically to be enabled. See also WebPTXPlayer. */
export const useInternalAppIds = () => {
  const customBuySellAppId = useFeature("buySellUi")?.params?.manifestId;

  const internalAppIds = useMemo(
    () => (customBuySellAppId ? INTERNAL_APP_IDS.concat([customBuySellAppId]) : INTERNAL_APP_IDS),
    [customBuySellAppId],
  );

  return internalAppIds;
};
