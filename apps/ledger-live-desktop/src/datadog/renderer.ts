import { ipcRenderer } from "electron";
import { datadogRum } from "@datadog/browser-rum";
import { datadogIdSelector, isDummyDatadogId } from "@ledgerhq/client-ids/store";
import { getOperatingSystemSupportStatus } from "~/support/os";
import { getDatadogBuildConfig, buildBeforeSend } from "./config";
import type { Store } from "redux";
import type { State } from "~/renderer/reducers";

const MAIN_ERROR_IPC = "main-error-to-datadog";

/** Default allowed tracing URLs for RUM↔APM (Ledger domains). Overridable via lldDatadog.params.allowedTracingUrls. */
const DEFAULT_ALLOWED_TRACING_URLS: (string | RegExp)[] = [/^https:\/\/[^/]+\.ledger\.com(\/|$)/];

/**
 * Parse allowedTracingUrls from FF. Firebase/FF sends JSON so we get string[].
 * We try to parse as RegExp when the string is in "/pattern/flags" form; otherwise use as literal URL.
 * - "/pattern/flags" (e.g. "/^https:\\/\\/.+\\.ledger\\.com\\//") → try new RegExp(pattern, flags); on throw, use string as literal.
 * - Plain string (e.g. "https://example.com") → literal URL match.
 */
function parseAllowedTracingUrls(fromParams: string[] | undefined): (string | RegExp)[] {
  if (!fromParams?.length) return DEFAULT_ALLOWED_TRACING_URLS;
  const slashRegex = /^\/(.*)\/([gimsuy]*)$/;
  return fromParams.map(s => {
    const trimmed = s.trim();
    const slashMatch = slashRegex.exec(trimmed);
    if (slashMatch) {
      try {
        return new RegExp(slashMatch[1], slashMatch[2] || undefined);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  });
}

let initialized = false;

export function isDatadogAvailable(): boolean {
  const { applicationId, clientToken } = getDatadogBuildConfig();
  return getOperatingSystemSupportStatus().supported && !!applicationId && !!clientToken;
}

/**
 * Initialize Datadog RUM in the renderer process.
 * Call only when lldDatadog.enabled and sentryLogs (user opt-in) are true.
 * Uses datadogId from the identities store (same segment as Sentry).
 */
export async function initDatadog(
  shouldSend: () => boolean,
  params:
    | {
        sessionSampleRate?: number;
        sessionReplaySampleRate?: number;
        defaultPrivacyLevel?: string;
        traceSampleRate?: number;
        /** From FF: regex as "/pattern/flags" or URL string */
        allowedTracingUrls?: string[];
        profilingSampleRate?: number;
      }
    | undefined,
  store: Store<State>,
): Promise<boolean> {
  if (initialized) return true;
  if (!shouldSend()) return false;

  const { applicationId, clientToken, site, env } = getDatadogBuildConfig();
  if (!applicationId || !clientToken) return false;
  if (getOperatingSystemSupportStatus().supported) {
    try {
      const allowedTracingUrls = parseAllowedTracingUrls(params?.allowedTracingUrls);

      const profilingRate = params?.profilingSampleRate;
      const profilingSampleRate =
        profilingRate === undefined ? undefined : Math.min(25, Math.max(0, profilingRate));

      datadogRum.init({
        applicationId,
        clientToken,
        site: site ?? "datadoghq.eu",
        service: "ledger-live-desktop",
        env: env ?? (__DEV__ ? "development" : "production"),
        version: __APP_VERSION__,
        sessionSampleRate: params?.sessionSampleRate ?? 100,
        sessionReplaySampleRate: params?.sessionReplaySampleRate ?? 0,
        // FF string; SDK expects union — cast after default
        defaultPrivacyLevel:
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- from FF, SDK validates
          (params?.defaultPrivacyLevel ?? "mask-user-input") as
            | "allow"
            | "mask"
            | "mask-user-input"
            | "mask-unless-allowlisted",
        traceSampleRate: params?.traceSampleRate ?? 100,
        allowedTracingUrls,
        ...(profilingSampleRate !== undefined && { profilingSampleRate: profilingSampleRate }),
        trackViewsManually: true,
        trackUserInteractions: true, // automatic click/tap actions
        trackResources: true, // XHR/fetch and resource timing
        beforeSend: buildBeforeSend(shouldSend),
        sessionPersistence: "local-storage",
      });

      datadogRum.startView("main");

      const datadogId = datadogIdSelector(store.getState());
      if (!isDummyDatadogId(datadogId)) {
        datadogRum.setUser({ id: datadogId.exportDatadogIdForRumUser() });
      }

      // Initial tags (parity with Sentry initialScope)
      datadogRum.setGlobalContext({
        git_commit: __GIT_REVISION__,
        process: globalThis.window === undefined ? "main" : "renderer",
      });

      // Listen for main process errors forwarded via IPC
      ipcRenderer.on(
        MAIN_ERROR_IPC,
        (_event, payload: { message: string; stack?: string; name?: string }) => {
          const err = new Error(payload.message);
          if (payload.name) err.name = payload.name;
          if (payload.stack) err.stack = payload.stack;
          captureException(err);
        },
      );

      initialized = true;
      return true;
    } catch (e) {
      console.error("Datadog RUM init failed", e);
      return false;
    }
  }
  return false;
}

export function captureException(error: Error): void {
  if (!initialized) return;
  try {
    datadogRum.addError(error);
  } catch {
    // no-op
  }
}

export interface Breadcrumb {
  level?: "debug" | "info" | "warning" | "error";
  category?: string;
  message: string;
  data?: Record<string, unknown>;
}

export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  if (!initialized) return;
  try {
    // Strip sessionId from track category (parity with Sentry beforeBreadcrumb)
    const data =
      breadcrumb.category === "track" && breadcrumb.data
        ? { ...breadcrumb.data, sessionId: undefined }
        : breadcrumb.data;
    datadogRum.addAction(breadcrumb.message, {
      context: data,
    });
  } catch {
    // no-op
  }
}

export function setTags(tags: Record<string, string | number | boolean | null | undefined>): void {
  if (!initialized) return;
  try {
    // setGlobalContext replaces the entire context; use setGlobalContextProperty so we keep
    // initial context (git_commit, process) set in initDatadog
    for (const [key, value] of Object.entries(tags)) {
      if (value !== undefined) {
        datadogRum.setGlobalContextProperty(key, value);
      }
    }
  } catch {
    // no-op
  }
}

export function setUser(id: string): void {
  if (!initialized) return;
  try {
    datadogRum.setUser({ id });
  } catch {
    // no-op
  }
}
