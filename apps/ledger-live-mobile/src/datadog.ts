import Config from "react-native-config";
import { TrackingConsent, DatadogProvider } from "@datadog/mobile-react-native";
import { PartialInitializationConfiguration } from "@datadog/mobile-react-native/lib/typescript/DdSdkReactNativeConfiguration";

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
