import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

const INTENTS = new Set(["deposit", "withdraw", "simulate"]);
const INTENT_PATHS = ["/deposit", "/withdraw", "/earn-simulator"];

/**
 * Tells whether the Earn live app sits on its dashboard rather than inside a deposit, withdraw or
 * simulator flow, so a dashboard reset can skip reloading it.
 *
 * Mirrors the mobile detection in ledger-live-mobile screens/PTX/Earn/getWebviewIntent.ts: the
 * dashboard has no fixed URL, so flows are recognised by their intent query param or path instead
 * of by comparing against the manifest URL.
 *
 * Returns false when the URL is unknown or not a real page yet (e.g. about:blank during load), so
 * that a reset still reloads rather than wrongly assuming the user is already home.
 */
export function isOnEarnDashboard(webviewUrl?: string): boolean {
  if (!webviewUrl) {
    return false;
  }

  const url = safeUrl(webviewUrl);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
    return false;
  }

  if (INTENTS.has(url.searchParams.get("intent") ?? "")) {
    return false;
  }

  return !INTENT_PATHS.some(path => url.pathname.includes(path));
}
