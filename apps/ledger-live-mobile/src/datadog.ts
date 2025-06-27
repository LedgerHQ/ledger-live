import Config from "react-native-config";
import { TrackingConsent, DatadogProvider } from "@datadog/mobile-react-native";
import { PartialInitializationConfiguration } from "@datadog/mobile-react-native/lib/typescript/DdSdkReactNativeConfiguration";
import { ScreenName } from "./const";
import { ViewNamePredicate } from "@datadog/mobile-react-navigation";

export const PORTFOLIO_VIEW_ID = "Portfolio";

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
  if (ScreenName.Portfolio === name) {
    return null;
  }
  if ([ScreenName.Asset].includes(name as ScreenName) && params?.currency?.id) {
    return `${trackedName}/${params?.currency?.id}`;
  }
  return trackedName;
};
