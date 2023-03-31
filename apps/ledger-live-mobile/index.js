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

// import all possible polyfills done by live-common for React Native. See in reactNative.ts for more details.
import "@ledgerhq/live-common/reactNative";

// add support for Promise.allSettled in RN. Shim is done after imports.
import allSettled from "promise.allsettled";

import { AppRegistry } from "react-native";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";

import { getEnv } from "@ledgerhq/live-common/env";
import BackgroundRunnerService from "./services/BackgroundRunnerService";
import App, { routingInstrumentation } from "./src";
import { getEnabled } from "./src/components/HookSentry";
import logReport from "./src/log-report";
import { getAllDivergedFlags } from "./src/components/FirebaseFeatureFlags";
import { enabledExperimentalFeatures } from "./src/experimental";
import { languageSelector } from "./src/reducers/settings";
import { store } from "./src/context/LedgerStore";

// @see "promise.allsettled" import
allSettled.shim();

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
  require("react-native-performance-flipper-reporter").setupDefaultFlipperReporter();
}

// we exclude errors related to user's environment, not fixable by us
const excludedErrorName = [
  // networking conditions
  "DisconnectedError",
  "Network Error",
  "NetworkDown",
  "NotConnectedError",
  // timeouts
  "TimeoutError",
  "WebsocketConnectionError",
  "TronTransactionExpired", // user waits too long on device, possibly network slowness too
  "SolanaTxConfirmationTimeout",
  // bad usage of device
  "BleError",
  "EthAppPleaseEnableContractData",
  "CantOpenDevice",
  "DisconnectedDevice",
  "DisconnectedDeviceDuringOperation",
  "DeviceOnDashboardExpected",
  "PairingFailed",
  "GetAppAndVersionUnsupportedFormat",
  "BluetoothRequired",
  "ManagerDeviceLocked",
  // errors coming from the usage of a Transport implementation
  "HwTransportError",
  // other
  "InvalidAddressError",
  "SwapNoAvailableProviders",
  "AccountNeedResync",
  "DeviceAppVerifyNotSupported",
  "AccountAwaitingSendPendingOperations",
  "HederaAddAccountError",
  // API issues
  "LedgerAPI4xx",
  "LedgerAPI5xx",
];
const excludedErrorDescription = [
  // networking
  /timeout of .* exceeded/,
  "timeout exceeded",
  "Network Error",
  "Network request failed",
  "INVALID_STATE_ERR",
  "API HTTP",
  "Unexpected ''",
  "Unexpected '<'",
  "Service Unvailable",
  // base usage of device
  /Device .* was disconnected/,
  "Invalid channel",
  /Ledger Device is busy/,
  "Ledger device: UNKNOWN_ERROR",
  // others
  "Transaction signing request was rejected by the user",
  "Transaction approval request was rejected",
  /Please reimport your .* accounts/,
  "database or disk is full",
  "Unable to open URL",
  "Received an invalid JSON-RPC message",
  // LIVE-3506 workaround, solana throws tons of cryptic errors
  "failed to find a healthy working node",
  "was reached for request with last error",
  "Transaction simulation failed",
  "530 undefined",
  "524 undefined",
  "Missing or invalid topic field", // wallet connect issue
];

if (Config.SENTRY_DSN && (!__DEV__ || Config.FORCE_SENTRY) && !Config.MOCK) {
  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: Config.SENTRY_ENVIRONMENT,
    // NB we do not need to explicitly set the release. we let the native side infers it.
    // release: `com.ledger.live@${pkg.version}+${VersionNumber.buildVersion}`,
    // dist: String(VersionNumber.buildVersion),
    sampleRate: 1,
    tracesSampleRate: Config.FORCE_SENTRY ? 1 : 0.005,
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation,
      }),
    ],
    beforeSend(event) {
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

  const MAX_KEYLEN = 32;
  const safekey = (k: string) => {
    if (k.length > MAX_KEYLEN) {
      const sep = "..";
      const max = MAX_KEYLEN - sep.length;
      const split1 = Math.floor(max / 2);
      return k.slice(0, split1) + ".." + k.slice(k.length - (max - split1));
    }
    return k;
  };

  // This sync the Sentry tags to include the extra information in context of events
  const syncTheTags = () => {
    const tags = {};
    // if there are experimental on, we will add them in tags
    enabledExperimentalFeatures().forEach(key => {
      tags[safekey(key)] = getEnv(key);
    });
    // if there are features on, we will add them in tags
    const appLanguage = languageSelector(store.getState());
    const features = getAllDivergedFlags(appLanguage);
    Object.keys(features).forEach(key => {
      tags[safekey(`f_${key}`)] = features[key];
    });
    Sentry.setTags(tags);
  };
  // We need to wait firebase to load the data and then we set once for all the tags
  setTimeout(syncTheTags, 5000);
  // We also try to regularly update them so we are sure to get the correct tags (as these are dynamic)
  setInterval(syncTheTags, 60000);
}

logReport.logReportInit();

const AppWithSentry = Sentry.wrap(App);

AppRegistry.registerComponent("ledgerlivemobile", () => AppWithSentry);
AppRegistry.registerHeadlessTask(
  "BackgroundRunnerService",
  () => BackgroundRunnerService,
);
