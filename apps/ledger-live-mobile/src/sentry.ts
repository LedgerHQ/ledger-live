import Config from "react-native-config";
import React from "react";
import * as Sentry from "@sentry/react-native";
import { EnvName, getEnv } from "@ledgerhq/live-env";
import { getEnabled } from "./components/HookSentry";
import { getAllDivergedFlags } from "./components/FirebaseFeatureFlags";
import { enabledExperimentalFeatures } from "./experimental";
import { languageSelector } from "./reducers/settings";
import { store } from "./context/LedgerStore";

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
  "VechainAppPleaseEnableContractDataAndMultiClause",
  "CantOpenDevice",
  "DisconnectedDevice",
  "DisconnectedDeviceDuringOperation",
  "DeviceOnDashboardExpected",
  "PairingFailed",
  "GetAppAndVersionUnsupportedFormat",
  "BluetoothRequired",
  "ManagerDeviceLocked",
  "LockedDeviceError",
  "UnresponsiveDeviceError",
  // wrong My Ledger provider selected for the firmware of the connected device
  "FirmwareNotRecognized",
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
  "Bad status on response: 503", // cryptoorg node
];

const sentryEnabled = Config.SENTRY_DSN && (!__DEV__ || Config.FORCE_SENTRY) && !Config.MOCK;

export function withSentry(App: React.ComponentType) {
  if (sentryEnabled) {
    Sentry.init({
      dsn: Config.SENTRY_DSN,
      environment: Config.SENTRY_ENVIRONMENT,
      // NB we do not need to explicitly set the release. we let the native side infers it.
      // release: `com.ledger.live@${pkg.version}+${VersionNumber.buildVersion}`,
      // dist: String(VersionNumber.buildVersion),
      sampleRate: 1,
      tracesSampleRate: Config.FORCE_SENTRY ? 1 : 0.0002,
      integrations: [new Sentry.ReactNativeTracing()],
      beforeSend(event) {
        if (!getEnabled()) return null;
        // If the error matches excludedErrorName or excludedErrorDescription,
        // we will not send it to Sentry.
        if (event && typeof event === "object") {
          const { exception } = event;
          if (exception && typeof exception === "object" && Array.isArray(exception.values)) {
            const { values } = exception;
            const shouldExclude = values.some(item => {
              if (item && typeof item === "object") {
                const { type, value } = item;
                return (typeof type === "string" &&
                  excludedErrorName.some(pattern => type.match(pattern))) ||
                  (typeof value === "string" &&
                    excludedErrorDescription.some(pattern => value.match(pattern)))
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
    const safekey = (k: string): string => {
      if (k.length > MAX_KEYLEN) {
        const sep = "..";
        const max = MAX_KEYLEN - sep.length;
        const split1 = Math.floor(max / 2);
        return k.slice(0, split1) + ".." + k.slice(k.length - (max - split1));
      }
      return k;
    };

    type Primitive = number | string | boolean | bigint | symbol | null | undefined;

    // This sync the Sentry tags to include the extra information in context of events
    const syncTheTags = () => {
      const tags: { [_: string]: Primitive } = {};
      // if there are experimental on, we will add them in tags
      enabledExperimentalFeatures().forEach(key => {
        const v = getEnv(key as EnvName);
        if (typeof v == "object" && v && Array.isArray(v)) {
          return; // skip this string[] case of envs
        }
        tags[safekey(key)] = v;
      });
      // if there are features on, we will add them in tags
      const appLanguage = languageSelector(store.getState());
      const features = getAllDivergedFlags(appLanguage);
      Object.keys(features).forEach(key => {
        tags[safekey(`f_${key}`)] = features[key as keyof typeof features];
      });
      Sentry.setTags(tags);
    };
    // We need to wait firebase to load the data and then we set once for all the tags
    setTimeout(syncTheTags, 5000);
    // We also try to regularly update them so we are sure to get the correct tags (as these are dynamic)
    setInterval(syncTheTags, 60000);

    return Sentry.wrap(App);
  }

  return App;
}
