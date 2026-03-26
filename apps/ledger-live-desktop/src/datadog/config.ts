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
    const message = getEventMessage(ev);
    if (message && shouldIgnoreErrorMessage(message)) return false;

    if ("server_name" in ev) delete ev.server_name;

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
