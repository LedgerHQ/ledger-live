// @flow
import os from "os";
import pname from "~/logger/pname";
import anonymizer from "~/logger/anonymizer";
import "../env";

/* eslint-disable no-continue */

// will be overriden by setShouldSendCallback
// initially we will send errors (anonymized as we don't initially know "userId" neither)
let shouldSendCallback = () => true;

let productionBuildSampleRate = 0.2;
let tracesSampleRate = 0.1;

if (process.env.SENTRY_SAMPLE_RATE) {
  const v = parseFloat(process.env.SENTRY_SAMPLE_RATE);
  productionBuildSampleRate = v;
  tracesSampleRate = v;
}

const ignoreErrors = [
  "failed with status code",
  "status code 404",
  "timeout",
  "socket hang up",
  "getaddrinfo",
  "could not read from HID device",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "ENETUNREACH",
  "request timed out",
  "NetworkDown",
  "ERR_CONNECTION_TIMED_OUT",
];

export function init(Sentry: any, opts: any) {
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
