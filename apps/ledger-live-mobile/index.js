// @flow

// Injects node.js shims.
// https://github.com/parshap/node-libs-react-native
import "node-libs-react-native/globals";

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

import App from "./src";
import { getEnabled } from "./src/components/HookSentry";
import logReport from "./src/log-report";
import pkg from "./package.json";

if (Config.SENTRY_DSN && !__DEV__ && !Config.MOCK) {
  const blacklistErrorName = ["NetworkDown"];
  const blacklistErrorDescription = [/Device .* was disconnected/];

  Sentry.init({
    dns: Config.SENTRY_DSN,
    release: `ledger-live-mobile@${pkg.version}`,
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

AppRegistry.registerComponent("ledgerlivemobile", () => App);
