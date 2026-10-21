/**
 * Pure helpers for the webview hardening layer. Kept free of any `electron`
 * imports so they can be unit-tested without mocking the Electron runtime.
 */
import path from "node:path";
import { isUrlAllowedByManifestDomains } from "@ledgerhq/live-common/wallet-api/manifestDomainUtils";
import { getStrictManifestDomains } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import { isBridgeSenderAllowed } from "@ledgerhq/live-common/wallet-api/bridgeSession";
import { WEBVIEW_BRIDGE_CHANNELS, type WebviewBridgeChannel } from "~/bridge/contract";
import {
  ALLOWED_ORIGINS_PREFERENCE,
  DOMAIN_CHECK_REPORT_PREFERENCE,
  UNRESTRICTED_ORIGINS,
  parseAllowedOrigins,
  parseDomainCheckReport,
  type WebviewAllowedOrigins,
  type WebviewDomainCheckReport,
} from "~/bridge/webviewAllowedOrigins";

const WEBVIEW_PRELOADS: ReadonlySet<string> = new Set([
  "webviewPreloader.bundle.js",
  "webviewDappPreloader.bundle.js",
]);

/**
 * Pins a <webview>'s preferences before Electron creates its guest, and returns
 * whether the guest may be created at all.
 *
 * Electron already copies isolation, sandbox and no-Node from the embedder; this
 * keeps them pinned even if the embedder changes, and covers what Electron does
 * not copy: the preload, web security and the first URL.
 */
export function applyWebviewAttachPolicy(
  webPreferences: Electron.WebPreferences,
  src: string,
  { appDir, isSrcAllowed }: { appDir: string; isSrcAllowed: (url: string) => boolean },
): boolean {
  webPreferences.nodeIntegration = false;
  webPreferences.nodeIntegrationInSubFrames = false;
  webPreferences.nodeIntegrationInWorker = false;
  webPreferences.contextIsolation = true;
  webPreferences.sandbox = true;
  webPreferences.webSecurity = true;

  // The renderer builds the preload URL from its own copy of the app dir, which is
  // not a valid file URL on Windows, so resolve the allowed bundles here instead of
  // comparing paths.
  const preload = webPreferences.preload ? path.basename(webPreferences.preload) : undefined;
  if (preload && WEBVIEW_PRELOADS.has(preload)) {
    webPreferences.preload = path.join(appDir, preload);
  } else {
    delete webPreferences.preload;
  }

  return isSrcAllowed(src);
}

/**
 * Removes the renderer-supplied allowed origins from a <webview>'s preferences
 * (Electron does not know the key) and returns them.
 */
export function takeAllowedOrigins(
  webPreferences: Electron.WebPreferences,
): WebviewAllowedOrigins | undefined {
  const preferences = webPreferences as Record<string, unknown>;
  const allowedOrigins = parseAllowedOrigins(preferences[ALLOWED_ORIGINS_PREFERENCE]);
  delete preferences[ALLOWED_ORIGINS_PREFERENCE];
  return allowedOrigins;
}

/**
 * Removes the renderer-supplied domain check report context from a <webview>'s
 * preferences and returns it, with the manifest domains reduced to the strict list.
 */
export function takeDomainCheckReport(
  webPreferences: Electron.WebPreferences,
): WebviewDomainCheckReport | undefined {
  const preferences = webPreferences as Record<string, unknown>;
  const report = parseDomainCheckReport(preferences[DOMAIN_CHECK_REPORT_PREFERENCE]);
  delete preferences[DOMAIN_CHECK_REPORT_PREFERENCE];
  return report && { ...report, domains: getStrictManifestDomains(report.domains) };
}

/**
 * Builds the main-frame origin check of Live App <webview> guests.
 *
 * A guest without allowed origins fails closed. `about:blank` always passes: it is
 * where a blocked guest is sent. Ledger Live's own deep links pass for any guest
 * that has allowed origins, since Ledger Live handles them itself.
 */
export function createMainFrameOriginChecker(
  supportedSchemes: string[],
): (url: string, allowedOrigins: WebviewAllowedOrigins | undefined) => boolean {
  const deepLinkProtocols = new Set(supportedSchemes.map(scheme => `${scheme}:`));

  return (url, allowedOrigins) => {
    if (url === "about:blank") return true;
    if (allowedOrigins === undefined) return false;

    let protocol: string;
    try {
      protocol = new URL(url).protocol;
    } catch {
      return false;
    }

    if (deepLinkProtocols.has(protocol)) return true;
    if (allowedOrigins === UNRESTRICTED_ORIGINS) return true;
    return isUrlAllowedByManifestDomains(url, allowedOrigins);
  };
}

/**
 * Whether main hands a Live App bridge message over to the embedder: only the guest main
 * frame is answered, on one of its allowed origins. A guest without allowed origins fails closed.
 */
export function isBridgeSenderFrameAllowed(
  sender: { origin: string; isMainFrame: boolean },
  allowedOrigins: WebviewAllowedOrigins | undefined,
): boolean {
  if (allowedOrigins === undefined || !sender.isMainFrame) return false;
  return isBridgeSenderAllowed(
    { url: sender.origin, isMainFrame: sender.isMainFrame },
    allowedOrigins === UNRESTRICTED_ORIGINS ? undefined : allowedOrigins,
  );
}

const webviewBridgeChannels: ReadonlySet<string> = new Set(WEBVIEW_BRIDGE_CHANNELS);

export function isWebviewBridgeChannel(channel: unknown): channel is WebviewBridgeChannel {
  return typeof channel === "string" && webviewBridgeChannels.has(channel);
}

/**
 * Returns the origin of a URL for logs, without its path or query.
 */
export function getLoggableOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "invalid URL";
  }
}

/**
 * Builds a scheme-allow checker for Live App <webview> navigations.
 *
 * Everything not in the allow list (itms-apps:, ms-word:, ms-notepad:,
 * ms-paint:, file:, javascript:, ...) is rejected so the OS's external
 * protocol handler cannot be triggered from within the webview via
 * <iframe src>, window.location, <a href target=_blank>, HTTP 3xx redirects,
 * etc.
 *
 * `ledgerlive:` / `ledgerwallet:` are allowed via `supportedSchemes`: these
 * are Ledger Live's own deep-link schemes (registered via `protocol.handle`
 * in dev mode and via `setAsDefaultProtocolClient` in production).
 * Navigations to them are handled internally by Ledger Live itself, never by
 * a third-party OS app, so they don't carry the external-handoff risk that
 * motivated this guard.
 */
export function createLiveAppSchemeChecker(supportedSchemes: string[]): (url: string) => boolean {
  const allowed = new Set([
    "http:",
    "https:",
    "about:",
    ...supportedSchemes.map(scheme => `${scheme}:`),
  ]);

  return (url: string): boolean => {
    try {
      return allowed.has(new URL(url).protocol);
    } catch {
      return false;
    }
  };
}

/**
 * Merges an extra Content-Security-Policy value into an existing set of
 * response headers without dropping any CSP already returned by the Live App.
 *
 * Browsers intersect multiple CSP headers, so stacking is safe and strictly
 * additive - our injected directives can only further restrict, not relax,
 * the effective policy.
 *
 * HTTP header names are case-insensitive; we normalise to the canonical
 * `Content-Security-Policy` key on write and leave any
 * `Content-Security-Policy-Report-Only` header untouched.
 */
export function mergeCspHeaders(
  responseHeaders: Record<string, string[]> | undefined,
  cspValue: string,
): Record<string, string[]> {
  const headers: Record<string, string[]> = { ...responseHeaders };

  const existingCspKey = Object.keys(headers).find(
    k => k.toLowerCase() === "content-security-policy",
  );
  const existingCsp = existingCspKey ? (headers[existingCspKey] ?? []) : [];
  if (existingCspKey) delete headers[existingCspKey];
  headers["Content-Security-Policy"] = [...existingCsp, cspValue];

  return headers;
}

/**
 * The CSP value injected on every guest <webview> document response.
 *
 * Scoped narrowly to the attack surface we care about (external-protocol
 * handoff from framed content and form submissions). We intentionally do
 * NOT set `default-src` / `script-src` here so we don't break Live App JS.
 *
 * `worker-src` is set explicitly so that web workers (e.g. Shopify Checkout
 * UI Extensions running inside Worker sandboxes) are not blocked by the
 * `child-src` fallback.
 */
export const WEBVIEW_GUEST_CSP =
  "frame-src 'self' http: https: blob:; " +
  "child-src 'self' http: https: blob:; " +
  "worker-src 'self' http: https: blob: data:; " +
  "form-action 'self' http: https:;";
