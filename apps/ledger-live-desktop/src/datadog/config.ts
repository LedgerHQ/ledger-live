import anonymizer from "~/sentry/anonymizer";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";

export type ShouldSendCallback = () => boolean;

function getEventMessage(ev: Record<string, unknown>): string {
  if (ev.error && typeof ev.error === "object") {
    const errObj = ev.error as Record<string, unknown>;
    if (typeof errObj.message === "string") return errObj.message;
  }
  if (typeof ev.message === "string") return ev.message;
  return "";
}

// Datadog matches source maps by service+version+file under the "app.asar" domain and only
// unminifies https://{domain}{file} frames, so rewrite the local asar prefix to "https://app.asar/".
// ASAR_FILE_URL: renderer (Browser SDK) file:// URLs; ASAR_RAW_PATH: raw filesystem paths, which may
// contain spaces, hence anchoring on the "(" / "at " frame delimiter.
const ASAR_FILE_URL = /file:\/\/\/?[^\s'"()]*?app\.asar\//g;
const ASAR_RAW_PATH = /(\(|\bat )((?:\/|[A-Za-z]:[\\/])[^()\n]*?)app\.asar\//g;

export function rewriteAsarUrls(text: string): string {
  return text
    .replace(ASAR_FILE_URL, "https://app.asar/")
    .replace(ASAR_RAW_PATH, "$1https://app.asar/");
}

function rewriteAsarUrlsRecursive(value: unknown, seen: Set<object>): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  const obj = value as Record<string, unknown>;
  for (const k in obj) {
    if (!Object.hasOwn(obj, k)) continue;
    const v = obj[k];
    if (typeof v === "string") obj[k] = rewriteAsarUrls(v);
    else rewriteAsarUrlsRecursive(v, seen);
  }
}

/**
 * Builds the beforeSend callback for Datadog RUM / Log.
 * Drops events when opt-in is off or error message matches ignore list;
 * applies anonymization to the payload (parity with Sentry).
 */
export function buildBeforeSend(shouldSend: ShouldSendCallback) {
  return (event: unknown, _context?: unknown): boolean => {
    if (!shouldSend()) return false;
    if (typeof event !== "object" || event === null) return true;

    const ev = event as Record<string, unknown>;
    const message = getEventMessage(ev);
    if (message && shouldIgnoreErrorMessage(message)) return false;

    if ("server_name" in ev) delete ev.server_name;

    try {
      anonymizer.filepathRecursiveReplacer(ev);
    } catch (e) {
      console.error("Datadog beforeSend: anonymization failed", e);
    }

    try {
      rewriteAsarUrlsRecursive(ev, new Set());
    } catch (e) {
      console.error("Datadog beforeSend: asar url rewrite failed", e);
    }

    return true;
  };
}

export function getDatadogBuildConfig(): {
  applicationId: string | null | undefined;
  clientToken: string | null | undefined;
  site: string;
  service: string;
  env: string;
} {
  return {
    applicationId: __DATADOG_APPLICATION_ID__,
    clientToken: __DATADOG_CLIENT_TOKEN__,
    site: __DATADOG_SITE__ ?? "datadoghq.eu",
    service: "ledger-live-desktop",
    env: __DATADOG_ENV__ ?? (__DEV__ ? "development" : "production"),
  };
}
