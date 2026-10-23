import Config from "react-native-config";
import {
  TrackingConsent,
  DatadogProvider,
  DdLogs,
  BatchSize,
  BatchProcessingLevel,
  UploadFrequency,
  VitalsUpdateFrequency,
} from "@datadog/mobile-react-native";
import type {
  PartialInitializationConfiguration,
  RumConfigurationOptions,
  LogsConfigurationOptions,
} from "@datadog/mobile-react-native";
import type { LogEvent } from "@ledgerhq/live-common/hooks/useBroadcast";
import type { Features } from "@shared/feature-flags";
import { ScreenName } from "./const";
import type { ViewNamePredicate } from "@datadog/mobile-react-navigation";
import { EXCLUDED_ERROR_DESCRIPTION, EXCLUDED_LOGS_ERROR_NAME } from "./utils/constants";
import { buildFeatureFlagTags } from "./utils/datadogUtils";
import { extractErrorContext } from "@ledgerhq/live-common/errors/helpers";
import {
  createCoinModuleCallTransmitter,
  readCoinObservabilityConfig,
  type CoinModuleCallEvent,
} from "@features/platform-coin-observability";
import {
  toDatadogBroadcastLog,
  type LogEvent as TransactionLogEvent,
} from "@ledgerhq/transaction-observability";

type DatadogRemoteParams = NonNullable<Features["llmDatadog"]["params"]>;
type ErrorEventMapper = NonNullable<RumConfigurationOptions["errorEventMapper"]>;
type ActionEventMapper = NonNullable<RumConfigurationOptions["actionEventMapper"]>;
type LogEventMapper = NonNullable<LogsConfigurationOptions["logEventMapper"]>;

const clientTokenVar = Config.DATADOG_CLIENT_TOKEN_VAR;
const applicationIdVar = Config.DATADOG_APPLICATION_ID_VAR;

const clientToken = process.env[`${clientTokenVar}`] || Config[`${clientTokenVar}`] || "";
const applicationId = process.env[`${applicationIdVar}`] || Config[`${applicationIdVar}`] || "";

export const isDatadogEnabled = !!clientToken && !!applicationId && !(Config.MOCK || Config.DETOX);

const baseConfig = {
  clientToken,
  env: Config.DATADOG_ENV || "",
  site: Config.DATADOG_SITE || "",
  service: Config.APP_NAME || "",
};

/**
 * Initializes the Datadog provider with the specified configuration and tracking consent.
 *
 * This function checks if Datadog is enabled via environment variables. If enabled,
 * it remaps the remote feature-flag parameters (still expressed in the flat v2 shape) onto the
 * SDK v3 nested configuration (rumConfiguration / logsConfiguration / traceConfiguration), merges
 * them with the base configuration and the provided tracking consent, then initializes the provider.
 *
 * @param remoteParams - Remote feature-flag parameters (`llmDatadog.params`) overriding the base settings.
 * @param trackingConsent - The user's tracking consent status, used to configure Datadog tracking behavior.
 * @returns A promise that resolves when the Datadog provider has been initialized, or immediately if Datadog is not enabled.
 */
export const initializeDatadogProvider = async (
  remoteParams: DatadogRemoteParams,
  trackingConsent: TrackingConsent,
) => {
  if (!isDatadogEnabled) {
    return;
  }

  const {
    serviceName,
    batchProcessingLevel,
    batchSize,
    uploadFrequency,
    vitalsUpdateFrequency,
    sessionSamplingRate,
    resourceTracingSamplingRate,
    longTaskThresholdMs,
    nativeInteractionTracking,
    nativeLongTaskThresholdMs,
    nativeViewTracking,
    trackBackgroundEvents,
    trackFrustrations,
    bundleLogsWithRum,
    bundleLogsWithTraces,
  } = remoteParams;

  const config: PartialInitializationConfiguration = {
    ...baseConfig,
    ...(serviceName ? { service: serviceName } : {}),
    ...(batchProcessingLevel
      ? { batchProcessingLevel: BatchProcessingLevel[batchProcessingLevel] }
      : {}),
    ...(batchSize ? { batchSize: BatchSize[batchSize] } : {}),
    ...(uploadFrequency ? { uploadFrequency: UploadFrequency[uploadFrequency] } : {}),
    trackingConsent,
    rumConfiguration: {
      applicationId,
      ...(sessionSamplingRate !== undefined ? { sessionSampleRate: sessionSamplingRate } : {}),
      ...(resourceTracingSamplingRate !== undefined
        ? { resourceTraceSampleRate: resourceTracingSamplingRate }
        : {}),
      ...(longTaskThresholdMs !== undefined
        ? { longTaskThresholdMs: longTaskThresholdMs === false ? 0 : longTaskThresholdMs }
        : {}),
      ...(nativeLongTaskThresholdMs !== undefined
        ? {
            nativeLongTaskThresholdMs:
              nativeLongTaskThresholdMs === false ? 0 : nativeLongTaskThresholdMs,
          }
        : {}),
      ...(nativeInteractionTracking !== undefined ? { nativeInteractionTracking } : {}),
      ...(nativeViewTracking !== undefined ? { nativeViewTracking } : {}),
      ...(vitalsUpdateFrequency
        ? { vitalsUpdateFrequency: VitalsUpdateFrequency[vitalsUpdateFrequency] }
        : {}),
      ...(trackBackgroundEvents !== undefined ? { trackBackgroundEvents } : {}),
      ...(trackFrustrations !== undefined ? { trackFrustrations } : {}),
    },
    logsConfiguration: {
      ...(bundleLogsWithRum !== undefined ? { bundleLogsWithRum } : {}),
      ...(bundleLogsWithTraces !== undefined ? { bundleLogsWithTraces } : {}),
    },
    traceConfiguration: {},
  };

  await DatadogProvider.initialize(config);
};

/**
 * Helper function to check if an error name (type) should be excluded.
 * @param errorName The name/type of the error from Datadog's RUM event.
 * @returns True if the error name is in the exclusion list, false otherwise.
 */
const isExcludedErrorName = (errorName: string): boolean => {
  return EXCLUDED_LOGS_ERROR_NAME.includes(errorName);
};

/**
 * Helper function to check if an error description (message) should be excluded.
 * Handles both string and RegExp patterns for robust matching.
 * @param errorDescription The message of the error from Datadog's RUM event.
 * @returns True if the error description matches any exclusion pattern, false otherwise.
 */
const isExcludedErrorDescription = (errorDescription: string): boolean => {
  return EXCLUDED_ERROR_DESCRIPTION.some(pattern => {
    if (typeof pattern === "string") {
      return errorDescription.includes(pattern);
    } else if (pattern instanceof RegExp) {
      return pattern.test(errorDescription);
    }
    return false;
  });
};

/**
 * The custom errorEventMapper function for Datadog RUM.
 * This function is called for every RUM error event before it is sent to Datadog.
 * @param event The RUMErrorEvent object.
 * @returns The modified RUMErrorEvent object, or null if the event should be dropped.
 */
export const customErrorEventMapper: (disableErrorTracking: boolean) => ErrorEventMapper =
  disableErrorTracking => event => {
    if (
      disableErrorTracking ||
      isExcludedErrorName(event.stacktrace) ||
      isExcludedErrorDescription(event.message)
    ) {
      return null; // Return null to drop the event
    }

    return {
      ...event,
      context: {
        ...event.context,
        featureFlags: buildFeatureFlagTags(),
      },
    };
  };

/**
 * Custom event mapper for action events.
 * @param event The ActionEvent object to map.
 * @returns The mapped ActionEvent object.
 */
export const customActionEventMapper: ActionEventMapper = event => {
  if (!event) return null;
  return {
    ...event,
    context: {
      ...event.context,
      featureFlags: buildFeatureFlagTags(),
    },
  };
};

/**
 * Custom event mapper for log events.
 * @param event The LogEvent object to map.
 * @returns The mapped LogEvent object.
 */
export const customLogEventMapper: LogEventMapper = event => {
  if (!event) return null;
  return {
    ...event,
    context: {
      ...event.context,
      featureFlags: buildFeatureFlagTags(),
    },
  };
};

export function broadcastLogger(event: LogEvent): void {
  if (!isDatadogEnabled) return;

  if (event.status === "success") {
    DdLogs.info("broadcast_success", { event });
  } else {
    const { error, ...rest } = event;
    const errorContext = extractErrorContext(error);
    DdLogs.error("broadcast_failure", error.name, error.message, error.stack ?? "", {
      event: {
        ...rest,
      },
      errorContext: errorContext,
    });
  }
}

const transmitCoinModuleCall = createCoinModuleCallTransmitter(readCoinObservabilityConfig);

/**
 * Coin-module call sink, gated on the `coinObservability` flag. Sampling and the failure cap are
 * applied before the SDK, so a dropped event never crosses the native bridge.
 */
export function coinModuleCallLogger(event: CoinModuleCallEvent): void {
  if (!isDatadogEnabled || !transmitCoinModuleCall(event)) return;

  if (event.status === "failure") {
    DdLogs.error("coin_module_call", { coinModule: event });
  } else {
    DdLogs.info("coin_module_call", { coinModule: event });
  }
}

/**
 * Broadcast outcomes seen at the bridge seam, for every family and every route. Gated on the
 * `coinObservability` flag too; never sampled, since there are a few per user action.
 */
export function transactionBroadcastLogger(event: TransactionLogEvent): void {
  if (!isDatadogEnabled || !readCoinObservabilityConfig()) return;

  const log = toDatadogBroadcastLog(event);
  if (!log) return;

  if (log.status === "success") {
    DdLogs.info(log.message, { broadcast: log.attributes });
  } else {
    // No error kind, message or stack: the mapper keeps only the error's name and category.
    DdLogs.error(log.message, { broadcast: log.attributes });
  }
}

/**
 * A predicate function to determine the view name for tracking purposes.
 *
 * This function modifies the view name based on the current route and its parameters.
 * If the route is the Portfolio screen, it returns null to stop tracking.
 * For the Asset screen, it appends the currency ID to the tracked name.
 *
 * @param route - The current navigation route.
 * @param trackedName - The base name to be tracked.
 * @returns The modified view name or null if tracking should be stopped.
 */
export const viewNamePredicate: ViewNamePredicate = ({ name, params }, trackedName) => {
  // If the route is the Portfolio screen, we stop the native navigation tracking as we will manually track the view
  if ([ScreenName.Portfolio, ScreenName.MarketList].includes(name as ScreenName)) {
    return null;
  }
  if ([ScreenName.Asset].includes(name as ScreenName) && params?.currency?.id) {
    return `${trackedName}/${params?.currency?.id}`;
  }
  // For other routes,
  return trackedName;
};
