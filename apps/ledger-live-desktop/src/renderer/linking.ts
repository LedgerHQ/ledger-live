import { track } from "@shared/analytics";
import { redactUrl, type OpenLinkOptions } from "@shared/linking";
import { shell } from "~/renderer/bridge";
import { isUrlSafe } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/isUrlSafe";

/**
 * Opens `url` in the browser and tracks it. Pass `{ sensitive: true }` when the URL carries user
 * data, such as an explorer link to a transaction or an address: the event then only gets its origin.
 */
export const openURL = (
  url: string,
  customEventName = "OpenURL",
  extraParams: object = {},
  options?: OpenLinkOptions,
) => {
  if (!isUrlSafe(url)) {
    console.warn(`Blocked potentially unsafe URL: ${url}`);
    return;
  }
  if (customEventName) {
    track(customEventName, {
      ...extraParams,
      url: options?.sensitive ? redactUrl(url) : url,
    });
  }
  shell.openExternal(url);
};
