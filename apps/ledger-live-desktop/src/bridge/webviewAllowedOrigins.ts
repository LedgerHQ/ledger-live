/**
 * Main-frame origins a Live App <webview> may load, sent from the renderer to the
 * main process in the `webpreferences` attribute: it is the only renderer data
 * Electron hands to `will-attach-webview`, before the guest's first load.
 */
export const ALLOWED_ORIGINS_PREFERENCE = "ledgerLiveAllowedOrigins";

/** The manifest domain check is off: any main-frame origin passes the manifest check. */
export const UNRESTRICTED_ORIGINS = "unrestricted";

export type WebviewAllowedOrigins = string[] | typeof UNRESTRICTED_ORIGINS;

/**
 * Electron splits `webpreferences` on `,` and `=`, which `encodeURIComponent` escapes.
 */
export function serializeAllowedOrigins(allowedOrigins: WebviewAllowedOrigins): string {
  const value =
    allowedOrigins === UNRESTRICTED_ORIGINS
      ? UNRESTRICTED_ORIGINS
      : encodeURIComponent(JSON.stringify(allowedOrigins));
  return `${ALLOWED_ORIGINS_PREFERENCE}=${value}`;
}

/**
 * Returns `undefined` for a missing or malformed value, which the main process
 * treats as "no origin allowed".
 */
export function parseAllowedOrigins(value: unknown): WebviewAllowedOrigins | undefined {
  if (value === UNRESTRICTED_ORIGINS) return UNRESTRICTED_ORIGINS;
  if (typeof value !== "string") return undefined;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (Array.isArray(parsed) && parsed.every(origin => typeof origin === "string")) {
      return parsed;
    }
  } catch {
    // Malformed value: fail closed.
  }
  return undefined;
}
