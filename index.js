// @flow

// Fix for crash with `Unsupported top level event type "onGestureHandlerStateChange" dispatched`
// https://github.com/kmagiera/react-native-gesture-handler/issues/320#issuecomment-443815828
import "react-native-gesture-handler";

/** URL polyfill */
// URL object `intentionally` lightweight, does not support URLSearchParams features
// https://github.com/facebook/react-native/issues/23922
import "react-native-url-polyfill/auto";

// cosmjs use TextEncoder that's not available in React Native but on Node
import "text-encoding-polyfill";

import { AppRegistry } from "react-native";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
import VersionNumber from "react-native-version-number";

import App, { routingInstrumentation } from "./src";
import { getEnabled } from "./src/components/HookSentry";
import logReport from "./src/log-report";
import pkg from "./package.json";

const blacklistErrorName = ["NetworkDown"];
const blacklistErrorDescription = [/Device .* was disconnected/];

if (Config.SENTRY_DSN && !__DEV__ && !Config.MOCK) {
  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: Config.SENTRY_ENVIRONMENT,
    release: `ledger-live-mobile@${pkg.version}`,
    dist: String(VersionNumber.buildVersion),
    tracesSampleRate: 0.001,
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation,
      }),
    ],
    beforeSend(event: any) {
      if (!getEnabled()) return null;
      // If the error matches blacklistErrorName or blacklistErrorDescription,
      // we will not send it to Sentry.
      if (event && typeof event === "object") {
        const { exception } = event;
        if (
          exception &&
          typeof exception === "object" &&
          Array.isArray(exception.values)
        ) {
          const { values } = exception;
          const shouldBlacklist = values.some(item => {
            if (item && typeof item === "object") {
              const { type, value } = item;
              return (typeof type === "string" &&
                blacklistErrorName.some(pattern => type.match(pattern))) ||
                (typeof value === "string" &&
                  blacklistErrorDescription.some(pattern =>
                    value.match(pattern),
                  ))
                ? event
                : null;
            }
            return null;
          });
          if (shouldBlacklist) return null;
        }
      }

      return event;
    },
  });
}

if (Config.DISABLE_YELLOW_BOX) {
  // $FlowFixMe
  console.disableYellowBox = true; // eslint-disable-line no-console
}

logReport.logReportInit();

const AppWithSentry = Sentry.wrap(App);

AppRegistry.registerComponent("ledgerlivemobile", () => AppWithSentry);
