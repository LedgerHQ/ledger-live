// @flow
import os from "os";
import pname from "~/logger/pname";
import anonymizer from "~/logger/anonymizer";
import "../env";
import { getOperatingSystemSupportStatus } from "~/support/os";

/* eslint-disable no-continue */

// will be overriden by setShouldSendCallback
// initially we will send errors (anonymized as we don't initially know "userId" neither)
let shouldSendCallback = () => true;

let productionBuildSampleRate = 1;
let tracesSampleRate = 0.005;

if (process.env.SENTRY_SAMPLE_RATE) {
  const v = parseFloat(process.env.SENTRY_SAMPLE_RATE);
  productionBuildSampleRate = v;
  tracesSampleRate = v;
}

const ignoreErrors = [
  // networking conditions
  "API HTTP",
  "DisconnectedError",
  "EACCES",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETDOWN",
  "ENETUNREACH",
  "ENOSPC",
  "ENOTFOUND",
  "EPERM",
  "ERR_CONNECTION_RESET",
  "ERR_PROXY_CONNECTION_FAILED",
  "ERR_NAME_NOT_RESOLVED",
  "ERR_INTERNET_DISCONNECTED",
  "ERR_NETWORK_CHANGED",
  "ETIMEDOUT",
  "getaddrinfo",
  "HttpError",
  "Network Error",
  "NetworkDown",
  "NetworkError",
  "NotConnectedError",
  "socket disconnected",
  "socket hang up",
  "ERR_SSL_PROTOCOL_ERROR",
  "status code 404",
  "unable to get local issuer certificate",
  // API issues
  "LedgerAPI4xx",
  "LedgerAPI5xx",
  "<!DOCTYPE html",
  "Unexpected ''",
  "Unexpected '<'",
  "Service Unvailable",
  // timeouts
  "ERR_CONNECTION_TIMED_OUT",
  "request timed out",
  "SolanaTxConfirmationTimeout",
  "timeout",
  "TimeoutError",
  "Time-out", // e.g.  504 Gateway Time-out
  "TronTransactionExpired", // user waits too long on device, possibly network slowness too
  "WebsocketConnectionError",
  // bad usage of device
  "BleError",
  "BluetoothRequired",
  "CantOpenDevice",
  "could not read from HID device",
  "DeviceOnDashboardExpected",
  "DisconnectedDevice",
  "DisconnectedDeviceDuringOperation",
  "EthAppPleaseEnableContractData",
  "failed with status code",
  "GetAppAndVersionUnsupportedFormat",
  "Invalid channel",
  "Ledger Device is busy",
  "ManagerDeviceLocked",
  "PairingFailed",
  "Ledger device: UNKNOWN_ERROR",
  // other
  "AccountAwaitingSendPendingOperations",
  "AccountNeedResync",
  "Cannot update while running on a read-only volume",
  "DeviceAppVerifyNotSupported",
  "InvalidAddressError",
  "Received an invalid JSON-RPC message",
  "SwapNoAvailableProviders",
  "TransactionRefusedOnDevice",
  "Please reimport your Tezos accounts",
  "Transaction simulation failed", // LIVE-3506
  // LIVE-3506 workaround, solana throws tons of cryptic errors
  "failed to find a healthy working node",
  "was reached for request with last error",
  "530 undefined",
  "524 undefined",
  "Missing or invalid topic field", // wallet connect issue
];

export function init(Sentry: any, opts: any) {
  if (!getOperatingSystemSupportStatus().supported) return false;
  if (!__SENTRY_URL__) return false;
  Sentry.init({
    dsn: __SENTRY_URL__,
    release: __APP_VERSION__,
    environment: __DEV__ ? "development" : "production",
    debug: __DEV__,
    ignoreErrors,
    sampleRate: __DEV__ ? 1 : productionBuildSampleRate,
    tracesSampleRate: __DEV__ ? 1 : tracesSampleRate,
    initialScope: {
      tags: {
        git_commit: __GIT_REVISION__,
        osType: os.type(),
        osRelease: os.release(),
        process: process?.title || "",
      },
      user: {
        ip_address: null,
      },
    },

    beforeSend(data: any, hint: any) {
      if (__DEV__) console.log("before-send", { data, hint });
      if (!shouldSendCallback()) return null;
      if (typeof data !== "object" || !data) return data;
      // $FlowFixMe
      delete data.server_name; // hides the user machine name
      anonymizer.filepathRecursiveReplacer(data);

      console.log("SENTRY REPORT", data);
      return data;
    },

    beforeBreadcrumb(breadcrumb) {
      switch (breadcrumb.category) {
        case "fetch":
        case "xhr": {
          // ignored, too verbose, lot of background http calls
          return null;
        }
        case "console": {
          if (pname === "internal") {
            // ignore console of internal because it's used to send to main and too verbose
            return null;
          }
        }
      }
      return breadcrumb;
    },

    ...opts,
  });

  Sentry.withScope(scope => scope.setExtra("process", pname));
  return true;
}

export function setShouldSendCallback(f: () => boolean) {
  shouldSendCallback = f;
}
