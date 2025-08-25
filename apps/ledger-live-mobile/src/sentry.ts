import Config from "react-native-config";
import * as Sentry from "@sentry/react-native";
import { EXCLUDED_ERROR_DESCRIPTION, EXCLUDED_LOGS_ERROR_NAME } from "./utils/constants";
import { Primitive } from "./types/helpers";
import { buildFeatureFlagTags } from "./utils/datadogUtils";

const sentryEnabled =
  Config.SENTRY_DSN && (!__DEV__ || Config.FORCE_SENTRY) && !(Config.MOCK || Config.DETOX);

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
  routeChangeTimeoutMs: 10_000,
  ignoreEmptyBackNavigationTransactions: false,
});

const SENTRY_DEBUG = Config.SENTRY_DEBUG === "true" && __DEV__;

export const initSentry = (automaticBugReportingEnabled: boolean) => {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: Config.SENTRY_ENVIRONMENT,
    debug: SENTRY_DEBUG,
    // NB we do not need to explicitly set the release. we let the native side infers it.
    // release: `com.ledger.live@${pkg.version}+${VersionNumber.buildVersion}`,
    // dist: String(VersionNumber.buildVersion),
    sampleRate: 1,
    enableAppStartTracking: true,
    enableAutoPerformanceTracing: true,
    enableNativeFramesTracking: true,
    enableStallTracking: true,
    enableUserInteractionTracing: true,
    enableAppHangTracking: true,
    profilesSampleRate: Config.FORCE_SENTRY ? 1 : 0.0004,
    tracesSampleRate: Config.FORCE_SENTRY ? 1 : 0.0003,
    integrations: [
      navigationIntegration,
      Sentry.reactNativeTracingIntegration({
        finalTimeoutMs: 100_000,
        idleTimeoutMs: 10_000,
      }),
    ],
    beforeSend(event) {
      if (!automaticBugReportingEnabled) return null;
      // If the error matches excludedErrorName or excludedErrorDescription,
      // we will not send it to Sentry.
      if (event && typeof event === "object") {
        const { exception } = event;
        if (exception && typeof exception === "object" && Array.isArray(exception.values)) {
          const { values } = exception;
          const shouldExclude = values.some(item => {
            if (item && typeof item === "object") {
              const { type, value } = item;
              return (
                (typeof type === "string" &&
                  EXCLUDED_LOGS_ERROR_NAME.some(pattern => type.match(pattern))) ||
                (typeof value === "string" &&
                  EXCLUDED_ERROR_DESCRIPTION.some(pattern => value.match(pattern)))
              );
            }
            return false;
          });
          if (shouldExclude) return null;
        }
      }
      return event;
    },
  });

  // This sync the Sentry tags to include the extra information in context of events
  const syncTheTags = () => {
    const tags: { [_: string]: Primitive } = buildFeatureFlagTags();
    Sentry.setTags(tags);
  };

  // We need to wait firebase to load the data and then we set once for all the tags
  setTimeout(syncTheTags, 5000);
  // We also try to regularly update them so we are sure to get the correct tags (as these are dynamic)
  setInterval(syncTheTags, 60000);
};

// TODO: remove this when Sentry is completely switched off
export function withSentry(App: React.ComponentType) {
  return sentryEnabled ? Sentry.wrap(App) : App;
}
