import { track } from "@shared/analytics";
import { shell } from "electron";
import { isUrlSafe } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/isUrlSafe";

export const openURL = (url: string, customEventName = "OpenURL", extraParams: object = {}) => {
  if (!isUrlSafe(url)) {
    console.warn(`Blocked potentially unsafe URL: ${url}`);
    return;
  }
  if (customEventName) {
    track(customEventName, {
      ...extraParams,
      url,
    });
  }
  return shell.openExternal(url);
};
