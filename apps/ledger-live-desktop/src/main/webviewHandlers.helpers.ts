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

/**
 * The CSP value injected on every guest <webview> document response.
 *
 * Scoped narrowly to the attack surface we care about (external-protocol
 * handoff from framed content and form submissions). We intentionally do
 * NOT set `default-src` / `script-src` here so we don't break Live App JS.
 */
export const WEBVIEW_GUEST_CSP =
  "frame-src 'self' http: https:; " +
  "child-src 'self' http: https:; " +
  "form-action 'self' http: https:;";
