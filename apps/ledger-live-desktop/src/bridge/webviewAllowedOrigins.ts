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

/** What the main process needs to report a Live App's domain check violations. */
export const DOMAIN_CHECK_REPORT_PREFERENCE = "ledgerLiveDomainCheckReport";

export type WebviewDomainCheckReport = {
  manifestId: string;
  /** `manifest.domains`, checked strictly even when the domain check is off. */
  domains: string[];
};

export function serializeDomainCheckReport(report: WebviewDomainCheckReport): string {
  return `${DOMAIN_CHECK_REPORT_PREFERENCE}=${encodeURIComponent(JSON.stringify(report))}`;
}

/** Returns `undefined` for a missing or malformed value: nothing is reported for that guest. */
export function parseDomainCheckReport(value: unknown): WebviewDomainCheckReport | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const { manifestId, domains } = parsed as Record<string, unknown>;
    if (
      typeof manifestId === "string" &&
      Array.isArray(domains) &&
      domains.every(domain => typeof domain === "string")
    ) {
      return { manifestId, domains };
    }
  } catch {
    // Malformed value: report nothing.
  }
  return undefined;
}
