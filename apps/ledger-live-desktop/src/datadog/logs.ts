import { datadogLogs } from "@datadog/browser-logs";
import type { LogEvent } from "@ledgerhq/live-common/hooks/useBroadcast";
import { getOperatingSystemSupportStatus } from "~/support/os";
import { buildBeforeSend, getDatadogBuildConfig, type ShouldSendCallback } from "./config";

let initialized = false;

/** Reset module state for tests so suites are order-independent. Do not use in production. */
export function __resetDatadogLogsForTesting(): void {
  initialized = false;
}

export function isDatadogLogsAvailable(): boolean {
  const { clientToken } = getDatadogBuildConfig();
  return getOperatingSystemSupportStatus().supported && !!clientToken;
}

/**
 * Initialize Datadog browser-logs.
 */
export function initDatadogLogs(shouldSend: ShouldSendCallback): boolean {
  if (initialized) return true;
  if (!shouldSend()) return false;

  const { clientToken, site, service, env } = getDatadogBuildConfig();
  if (!clientToken) return false;
  if (!getOperatingSystemSupportStatus().supported) return false;

  try {
    datadogLogs.init({
      clientToken,
      site,
      service,
      env,
      version: __APP_VERSION__,
      sessionSampleRate: 100,
      forwardErrorsToLogs: false,
      forwardConsoleLogs: [],
      forwardReports: [],
      beforeSend: buildBeforeSend(shouldSend),
      sessionPersistence: "local-storage",
    });

    datadogLogs.setGlobalContext({
      git_commit: __GIT_REVISION__,
      process: globalThis.window === undefined ? "main" : "renderer",
    });

    initialized = true;
    return true;
  } catch (e) {
    console.error("Datadog Logs init failed", e);
    return false;
  }
}

export function broadcastLogger(event: LogEvent): void {
  if (!initialized) return;

  if (event.status === "success") {
    datadogLogs.logger.info("broadcast_success", { event });
  } else {
    const { error, ...rest } = event;
    datadogLogs.logger.error("broadcast_failure", { event: rest }, error);
  }
}
