import Config from "react-native-config";
import { TrackingConsent, DatadogProvider } from "@datadog/mobile-react-native";
import { PartialInitializationConfiguration } from "@datadog/mobile-react-native/lib/typescript/DdSdkReactNativeConfiguration";

import { ErrorEventMapper } from "@datadog/mobile-react-native/lib/typescript/rum/eventMappers/errorEventMapper";
import { EXCLUDED_ERROR_DESCRIPTION, EXCLUDED_LOGS_ERROR_NAME } from "./utils/constants";

const clientTokenVar = Config.DATADOG_CLIENT_TOKEN_VAR;
const applicationIdVar = Config.DATADOG_APPLICATION_ID_VAR;

const clientToken = process.env[`${clientTokenVar}`] || Config[`${clientTokenVar}`] || "";
const applicationId = process.env[`${applicationIdVar}`] || Config[`${applicationIdVar}`] || "";

const isDatadogEnabled = !!clientToken && !!applicationId;

const baseConfig: PartialInitializationConfiguration = {
  clientToken,
  applicationId,
  env: Config.DATADOG_ENV || "",
  site: Config.DATADOG_SITE || "",
  serviceName: Config.APP_NAME || "",
};

/**
 * Initializes the Datadog provider with the specified configuration and tracking consent.
 *
 * This function checks if Datadog is enabled via environment variables. If enabled,
 * it merges the base configuration with any remote configuration overrides and the provided
 * tracking consent, then initializes the Datadog provider.
 *
 * @param remoteConfig - Partial configuration object to override the base Datadog initialization settings.
 * @param trackingConsent - The user's tracking consent status, used to configure Datadog tracking behavior.
 * @returns A promise that resolves when the Datadog provider has been initialized, or immediately if Datadog is not enabled.
 */
export const initializeDatadogProvider = async (
  remoteConfig: Partial<PartialInitializationConfiguration>,
  trackingConsent: TrackingConsent,
) => {
  if (!isDatadogEnabled) {
    return;
  }
  await DatadogProvider.initialize({
    ...baseConfig,
    ...remoteConfig,
    trackingConsent,
  });
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
export const customErrorEventMapper: ErrorEventMapper = event => {
  if (isExcludedErrorName(event.stacktrace) || isExcludedErrorDescription(event.message)) {
    return null; // Return null to drop the event
  }

  return event;
};
