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

// we exclude errors related to user's environment, not fixable by us
const excludedErrorName = [
  // networking conditions
  "DisconnectedError",
  "Network Error",
  "NetworkDown",
  "NotConnectedError",
  "TimeoutError",
  "WebsocketConnectionError",
  // bad usage of device
  "BleError",
  "EthAppPleaseEnableContractData",
  "CantOpenDevice",
  "DisconnectedDeviceDuringOperation",
  "PairingFailed",
];
const excludedErrorDescription = [
  // networking
  /timeout of .* exceeded/,
  // base usage of device
  /Device .* was disconnected/,
  "Invalid channel",
  // others
  "Transaction signing request was rejected by the user",
];

if (true || (Config.SENTRY_DSN && !__DEV__ && !Config.MOCK)) {
  Sentry.init({
    dsn: "https://c97c794257cf4bdca28b703c233a7b07@o118392.ingest.sentry.io/6323440", // Config.SENTRY_DSN,
    environment: "staging", // Config.SENTRY_ENVIRONMENT,
    // NB we do not need to explicitly set the release. we let the native side infers it.
    // release: `com.ledger.live@${pkg.version}+${VersionNumber.buildVersion}`,
    // dist: String(VersionNumber.buildVersion),
    sampleRate: 0.2,
    tracesSampleRate: 0.02,
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation,
      }),
    ],
    beforeSend(event: any) {
      // TODO : Rating feature : catch crash here ?
      getRatingsDataOfUserFromStorage().then(ratingsDataOfUser => {
        setRatingsDataOfUserInStorage({
          ...ratingsDataOfUser,
          numberOfAppStartsSinceLastCrash: 0,
        });
      });
      return null;
      if (!getEnabled()) return null;
      // If the error matches excludedErrorName or excludedErrorDescription,
      // we will not send it to Sentry.
      if (event && typeof event === "object") {
        const { exception } = event;
        if (
          exception &&
          typeof exception === "object" &&
          Array.isArray(exception.values)
        ) {
          const { values } = exception;
          const shouldExclude = values.some(item => {
            if (item && typeof item === "object") {
              const { type, value } = item;
              return (typeof type === "string" &&
                excludedErrorName.some(pattern => type.match(pattern))) ||
                (typeof value === "string" &&
                  excludedErrorDescription.some(pattern =>
                    value.match(pattern),
                  ))
                ? event
                : null;
            }
            return null;
          });
          if (shouldExclude) return null;
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
