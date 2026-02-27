import anonymizer from "~/sentry/anonymizer";
import { shouldIgnoreErrorMessage } from "./ignoreErrors";

export type ShouldSendCallback = () => boolean;

/**
 * Builds the beforeSend callback for Datadog RUM.
 * Drops events when opt-in is off or error message matches ignore list;
 * applies anonymization to the payload (parity with Sentry).
 */
export function buildBeforeSend(shouldSend: ShouldSendCallback) {
  return (event: unknown, _context?: unknown): boolean => {
    if (!shouldSend()) return false;
    if (typeof event !== "object" || event === null) return true;

    const ev = event as Record<string, unknown>;

    // Error events (event.type === 'error'): drop if message matches ignore list
    let message = "";
    if (ev.error && typeof ev.error === "object") {
      const errObj = ev.error as Record<string, unknown>;
      if (typeof errObj.message === "string") message = errObj.message;
    }
    if (!message && typeof ev.message === "string") message = ev.message;
    if (message && shouldIgnoreErrorMessage(message)) return false;

    // Remove server_name (machine name)
    if ("server_name" in ev) delete ev.server_name;

    // Anonymize file paths in payload (parity with Sentry)
    try {
      anonymizer.filepathRecursiveReplacer(ev);
    } catch (e) {
      console.error("Datadog beforeSend: anonymization failed", e);
    }

    return true;
  };
}

export function getDatadogBuildConfig(): {
  applicationId: string | null | undefined;
  clientToken: string | null | undefined;
  site: string | null | undefined;
  env: string | null | undefined;
} {
  return {
    applicationId: __DATADOG_APPLICATION_ID__,
    clientToken: __DATADOG_CLIENT_TOKEN__,
    site: __DATADOG_SITE__,
    env: __DATADOG_ENV__,
  };
}
