import { datadogRum } from "@datadog/browser-rum";
import { datadogIdSelector, isDummyDatadogId } from "@ledgerhq/client-ids/store";
import { getOperatingSystemSupportStatus } from "~/support/os";
import { getDatadogBuildConfig, buildBeforeSend } from "./config";
import type { Store } from "redux";
import type { State } from "~/renderer/reducers";

/** Allowed values for Datadog RUM defaultPrivacyLevel. */
const ALLOWED_PRIVACY_LEVELS = [
  "allow",
  "mask",
  "mask-user-input",
  "mask-unless-allowlisted",
] as const;
type DefaultPrivacyLevel = (typeof ALLOWED_PRIVACY_LEVELS)[number];

function normalizeDefaultPrivacyLevel(value: string | undefined): DefaultPrivacyLevel {
  if (value != null && ALLOWED_PRIVACY_LEVELS.includes(value as DefaultPrivacyLevel)) {
    return value as DefaultPrivacyLevel;
  }
  return "mask-user-input";
}

/** Default allowed tracing URLs for RUM↔APM (Ledger domains). Overridable via lldDatadog.params.allowedTracingUrls. */
const DEFAULT_ALLOWED_TRACING_URLS: (string | RegExp)[] = [/^https:\/\/[^/]+\.ledger\.com(\/|$)/];

/**
 * Parse allowedTracingUrls from FF. Firebase/FF sends JSON so we get string[].
 * We try to parse as RegExp when the string is in "/pattern/flags" form; otherwise use as literal URL.
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

/** Reset module state for tests so suites are order-independent. Do not use in production. */
export function __resetDatadogForTesting(): void {
  initialized = false;
}

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
        allowedTracingUrls?: string[];
        profilingSampleRate?: number;
      }
    | undefined,
  store: Store<State>,
): Promise<boolean> {
  if (initialized) return true;
  if (!shouldSend()) return false;

  const { applicationId, clientToken, site, service, env } = getDatadogBuildConfig();
  if (!applicationId || !clientToken) return false;
  if (!getOperatingSystemSupportStatus().supported) return false;

  try {
    const allowedTracingUrls = parseAllowedTracingUrls(params?.allowedTracingUrls);

    const profilingRate = params?.profilingSampleRate;
    const profilingSampleRate =
      profilingRate === undefined ? undefined : Math.min(25, Math.max(0, profilingRate));

    datadogRum.init({
      applicationId,
      clientToken,
      site,
      service,
      env,
      version: __APP_VERSION__,
      sessionSampleRate: params?.sessionSampleRate ?? 100,
      sessionReplaySampleRate: params?.sessionReplaySampleRate ?? 0,
      defaultPrivacyLevel: normalizeDefaultPrivacyLevel(params?.defaultPrivacyLevel),
      traceSampleRate: params?.traceSampleRate ?? 100,
      allowedTracingUrls,
      ...(profilingSampleRate !== undefined && { profilingSampleRate }),
      trackViewsManually: true,
      trackUserInteractions: true,
      trackResources: true,
      beforeSend: buildBeforeSend(shouldSend),
      sessionPersistence: "local-storage",
    });

    datadogRum.startView("main");

    const datadogId = datadogIdSelector(store.getState());
    if (!isDummyDatadogId(datadogId)) {
      datadogRum.setUser({ id: datadogId.exportDatadogIdForRumUser() });
    }

    datadogRum.setGlobalContext({
      git_commit: __GIT_REVISION__,
      process: globalThis.window === undefined ? "main" : "renderer",
    });

    initialized = true;
    return true;
  } catch (e) {
    console.error("Datadog RUM init failed", e);
    return false;
  }
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
