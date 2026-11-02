import { datadogLogs } from "@datadog/browser-logs";
import type { LogEvent } from "@ledgerhq/live-common/hooks/useBroadcast";
import { getOperatingSystemSupportStatus } from "~/support/os";
import { buildBeforeSend, getDatadogBuildConfig, type ShouldSendCallback } from "./config";
import {
  toBroadcastFailureLog,
  toBroadcastLogEvent,
} from "@ledgerhq/live-common/hooks/broadcastLog";
import {
  createCoinModuleCallTransmitter,
  readCoinObservabilityConfig,
  type CoinModuleCallEvent,
} from "@features/platform-coin-observability";
import {
  toDatadogBroadcastLog,
  type LogEvent as TransactionLogEvent,
} from "@ledgerhq/transaction-observability";

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

const transmitCoinModuleCall = createCoinModuleCallTransmitter(readCoinObservabilityConfig);

/**
 * Coin-module call sink, gated on the `coinObservability` flag. Sampling and the failure cap are
 * applied here, before the consent gate in `beforeSend`, so a dropped event never reaches the SDK.
 */
export function coinModuleCallLogger(event: CoinModuleCallEvent): void {
  if (!initialized || !transmitCoinModuleCall(event)) return;

  if (event.status === "failure") {
    datadogLogs.logger.error("coin_module_call", { coinModule: event });
  } else {
    datadogLogs.logger.info("coin_module_call", { coinModule: event });
  }
}

/**
 * Broadcast outcomes seen at the bridge seam, for every family and every route. Gated on the
 * `coinObservability` flag too; never sampled, since there are a few per user action.
 */
export function transactionBroadcastLogger(event: TransactionLogEvent): void {
  if (!initialized || !readCoinObservabilityConfig()) return;

  const log = toDatadogBroadcastLog(event);
  if (!log) return;

  if (log.status === "success") {
    datadogLogs.logger.info(log.message, { broadcast: log.attributes });
  } else {
    // No `Error` argument: the mapper keeps only the error's name and category.
    datadogLogs.logger.error(log.message, { broadcast: log.attributes });
  }
}

export function broadcastLogger(event: LogEvent): void {
  if (!initialized) return;

  if (event.status === "success") {
    datadogLogs.logger.info("broadcast_success", { event: toBroadcastLogEvent(event) });
  } else {
    const { event: loggedEvent, errorContext, error } = toBroadcastFailureLog(event);
    datadogLogs.logger.error("broadcast_failure", { event: loggedEvent, errorContext }, error);
  }
}
