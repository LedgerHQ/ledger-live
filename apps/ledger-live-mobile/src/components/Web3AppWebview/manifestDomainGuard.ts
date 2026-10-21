import { Linking } from "react-native";
import { isUrlAllowedByManifestDomains } from "@ledgerhq/live-common/wallet-api/manifestDomainUtils";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

const LEDGER_DEEPLINK_PROTOCOLS = new Set(["ledgerlive:", "ledgerwallet:"]);
const EXTERNALLY_OPENABLE_PROTOCOLS = new Set(["https:", ...LEDGER_DEEPLINK_PROTOCOLS]);

/**
 * react-native-webview matches originWhitelist entries as prefixes ("https://a.com" also
 * matches "https://a.com.evil.com"), so it is only a scheme guard here and the main-frame
 * decision belongs to onShouldStartLoadWithRequest. Ledger deeplinks are listed so they reach
 * that callback instead of the library's canOpenURL fallback, which iOS answers with false for
 * schemes missing from LSApplicationQueriesSchemes.
 */
export const MANIFEST_DOMAIN_CHECK_ORIGIN_WHITELIST: string[] = [
  "https://*",
  "ledgerlive://*",
  "ledgerwallet://*",
];

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

export function isExternallyOpenableUrl(url: string): boolean {
  const protocol = getProtocol(url);
  return protocol !== null && EXTERNALLY_OPENABLE_PROTOCOLS.has(protocol);
}

/**
 * Main frame: loads only on an origin listed in manifest.domains, and Ledger deeplinks are
 * handed to Linking instead of being loaded. Subframes stay on the originWhitelist scheme guard
 * so 3-D Secure / KYC iframes keep working, but cannot trigger deeplinks. A request without
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

  if (!isMainFrame) return true;

  return isUrlAllowedByManifestDomains(request.url, domains);
}

export function openWindowExternally(targetUrl: string, restrictToSafeSchemes: boolean): void {
  if (restrictToSafeSchemes && !isExternallyOpenableUrl(targetUrl)) return;
  // Don't use canOpenURL as we cannot check unknown apps on the phone
  // Without listing everything in plist and android manifest
  Linking.openURL(targetUrl).catch(() => {});
}
