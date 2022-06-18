// @flow
import os from "os";
import pname from "~/logger/pname";
import anonymizer from "~/logger/anonymizer";
/* eslint-disable no-continue */

// will be overriden by setShouldSendCallback
// initially we will send errors (anonymized as we don't initially know "userId" neither)
let shouldSendCallback = () => true;

require("../env");

let productionBuildSampleRate = 0.01;
if (process.env.SENTRY_SAMPLE_RATE) {
  productionBuildSampleRate = parseFloat(process.env.SENTRY_SAMPLE_RATE);
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

export function init(Sentry: any) {
  if (!__SENTRY_URL__) return false;
  Sentry.init({
    dsn: __SENTRY_URL__,
    release: __APP_VERSION__,
    environment: __DEV__ ? "development" : "production",
    debug: __DEV__,
    ignoreErrors,
    sampleRate: __DEV__ ? 1 : productionBuildSampleRate,
    initialScope: {
      tags: {
        git_commit: __GIT_REVISION__,
        osType: os.type(),
        osRelease: os.release(),
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

      if (typeof data.request === "object" && data.request) {
        const { request } = data;
        if (typeof request.url === "string") {
          // $FlowFixMe not sure why
          request.url = anonymizer.appURI(request.url);
        }
      }

      anonymizer.filepathRecursiveReplacer(data);
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
  });

  Sentry.withScope(scope => scope.setExtra("process", pname));
  return true;
}

export function setShouldSendCallback(f: () => boolean) {
  shouldSendCallback = f;
}
