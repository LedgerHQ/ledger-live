import { Linking } from "react-native";
import { isUrlAllowedByManifestDomains } from "@ledgerhq/live-common/wallet-api/manifestDomainUtils";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

const LEDGER_DEEPLINK_PROTOCOLS = new Set(["ledgerlive:", "ledgerwallet:"]);
// about:, blob: and data: documents inherit their creator's origin or get an opaque one.
const SUBFRAME_PROTOCOLS = new Set(["https:", "about:", "blob:", "data:"]);

/**
 * Every request reaches onShouldStartLoadWithRequest: on an originWhitelist miss,
 * react-native-webview hands the URL to Linking (e.g. an http link opens the external browser),
 * even from a subframe. shouldStartLoadWithManifestDomains decides for every scheme instead.
 */
export const MANIFEST_DOMAIN_CHECK_ORIGIN_WHITELIST: string[] = ["*"];

function getProtocol(url: string): string | null {
  try {
    return new URL(url).protocol;
  } catch {
    return null;
  }
}

export function isLedgerDeeplink(url: string): boolean {
  const protocol = getProtocol(url);
  return protocol !== null && LEDGER_DEEPLINK_PROTOCOLS.has(protocol);
}

/**
 * Popups carry no source frame, so they never open Ledger deeplinks: an iframe could open one.
 */
export function isExternallyOpenableUrl(url: string): boolean {
  return getProtocol(url) === "https:";
}

/**
 * Main frame: loads only on an origin listed in manifest.domains, and Ledger deeplinks are
 * handed to Linking instead of being loaded. Subframes load https (3-D Secure / KYC iframes)
 * and local about:, blob: and data: documents, but cannot trigger deeplinks. A request without
 * isTopFrame is treated as a main-frame request.
 */
export function shouldStartLoadWithManifestDomains(
  request: Pick<ShouldStartLoadRequest, "url" | "isTopFrame">,
  domains: string[],
): boolean {
  const isMainFrame = request.isTopFrame !== false;

  if (isLedgerDeeplink(request.url)) {
    if (isMainFrame) Linking.openURL(request.url).catch(() => {});
    return false;
  }

  if (!isMainFrame) {
    const protocol = getProtocol(request.url);
    return protocol !== null && SUBFRAME_PROTOCOLS.has(protocol);
  }

  return isUrlAllowedByManifestDomains(request.url, domains);
}

/**
 * A main frame that committed an http(s) URL outside manifest.domains. Android does not ask
 * onShouldStartLoadWithRequest for POST navigations, and lets a navigation through when JS does
 * not answer in time: such a main frame is only detected once it starts loading.
 */
export function isMainFrameUrlBlocked(url: string, domains: string[]): boolean {
  const protocol = getProtocol(url);
  if (protocol !== "https:" && protocol !== "http:") return false;
  return !isUrlAllowedByManifestDomains(url, domains);
}

export function openWindowExternally(targetUrl: string, restrictToSafeSchemes: boolean): void {
  if (restrictToSafeSchemes && !isExternallyOpenableUrl(targetUrl)) return;
  // Don't use canOpenURL as we cannot check unknown apps on the phone
  // Without listing everything in plist and android manifest
  Linking.openURL(targetUrl).catch(() => {});
}
