/**
 * Pure helpers for the webview hardening layer. Kept free of any `electron`
 * imports so they can be unit-tested without mocking the Electron runtime.
 */

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

// A `Permissions-Policy` value is a structured-fields dictionary: comma-separated
// `feature=allowlist` members, where an allowlist is a token (`*`, `self`), a
// quoted origin, or a parenthesised list of either.
const SF_ITEM = String.raw`(?:[a-zA-Z*][a-zA-Z0-9_.:*/-]*|"(?:[^"\\]|\\.)*")`;
const PERMISSIONS_POLICY_MEMBER = new RegExp(
  String.raw`^[a-z*][a-z0-9_.*-]*` +
    String.raw`(?:=(?:${SF_ITEM}|\(\s*(?:${SF_ITEM}(?:\s+${SF_ITEM})*\s*)?\)))?` +
    String.raw`(?:;[^,]*)?$`,
);

/**
 * Chromium discards the WHOLE dictionary on a parse error, so a Live App
 * returning a deliberately malformed policy would take our injected member down
 * with it. Deliberately lenient: dropping a policy that was in fact valid would
 * cost the app a real delegation.
 */
export function isParsablePermissionsPolicy(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return trimmed.split(",").every(member => PERMISSIONS_POLICY_MEMBER.test(member.trim()));
}

/**
 * Merges our policy into the one the Live App returned, rather than replacing
 * it: overwriting a `camera=(self "https://kyc.example")` delegation would fall
 * back to the `self` default and break getUserMedia in the KYC iframe.
 *
 * `Permissions-Policy` is a structured-fields dictionary, and a repeated key
 * overwrites the previous one (RFC 8941 4.2.2) - every instance of the header
 * is comma-joined in order before parsing - so ours goes LAST to win a direct
 * conflict, and an unparsable value is dropped rather than merged. Normalised
 * to the canonical key (HTTP/2 always lowercases it).
 */
export function mergePermissionsPolicyHeaders(
  responseHeaders: Record<string, string[]> | undefined,
  permissionsPolicyValue: string,
): Record<string, string[]> {
  const headers: Record<string, string[]> = { ...responseHeaders };

  const existingKey = Object.keys(headers).find(k => k.toLowerCase() === "permissions-policy");
  const existingPolicy = existingKey ? (headers[existingKey] ?? []) : [];
  if (existingKey) delete headers[existingKey];
  const preserved = existingPolicy.every(isParsablePermissionsPolicy) ? existingPolicy : [];
  headers["Permissions-Policy"] = [...preserved, permissionsPolicyValue];

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

/**
 * Guests were granted everything before this allowlist existed, so anything
 * left out is a behaviour change. `storage-access` keeps a cross-site KYC
 * iframe's cookies working under partitioned storage; `clipboard-read` backs
 * "paste a WalletConnect URI" style affordances.
 */
export const GUEST_ALLOWED_PERMISSIONS = new Set([
  "fullscreen",
  "clipboard-sanitized-write",
  "clipboard-read",
  "storage-access",
  "top-level-storage-access",
]);

export const HOST_ALLOWED_PERMISSIONS = new Set([
  "fullscreen",
  "clipboard-sanitized-write",
  "clipboard-read",
]);

/**
 * Electron fills `mediaTypes` from Chromium's *device* capture types only, so a
 * screen capture requested through `getUserMedia` arrives with an empty list
 * (measured on Electron 43.1.1, DONJON-1404).
 */
export function isDeviceCaptureRequest(mediaTypes: Array<"video" | "audio"> | undefined): boolean {
  return !!mediaTypes?.length;
}

export function resolvePermissionRequest({
  isGuest,
  permission,
  mediaTypes,
}: {
  isGuest: boolean;
  permission: string;
  mediaTypes?: Array<"video" | "audio">;
}): boolean {
  if (permission === "display-capture") return false;
  if (permission === "media") return isDeviceCaptureRequest(mediaTypes);
  return (isGuest ? GUEST_ALLOWED_PERMISSIONS : HOST_ALLOWED_PERMISSIONS).has(permission);
}

/**
 * `media` stays denied for everyone: Chromium reaches the request handler only
 * when the check denies, and that is where screen capture is filtered out.
 * `hid` is decided here alone - Electron has no `hid` permission request.
 */
export function resolvePermissionCheck({
  isGuest,
  permission,
}: {
  isGuest: boolean;
  permission: string;
}): boolean {
  if (permission === "media") return false;
  if (isGuest) return GUEST_ALLOWED_PERMISSIONS.has(permission);
  return permission === "hid";
}

export const WEBVIEW_GUEST_PERMISSIONS_POLICY = "display-capture=()";
