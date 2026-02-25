import { shell } from "electron";
import { isUrlSafe } from "~/helpers/urlSafety";

/**
 * Opens a URL in the default browser from the main process.
 * Only allows http/https protocols for security.
 * Note: This is a main-process version without analytics tracking.
 * For renderer process use ~/renderer/linking instead.
 */
export const openURL = (url: string): void => {
  if (!isUrlSafe(url)) {
    console.warn(`Blocked potentially unsafe URL: ${url}`);
    return;
  }
  // eslint-disable-next-line no-restricted-syntax -- This IS the safe wrapper that validates URLs
  shell.openExternal(url);
};
