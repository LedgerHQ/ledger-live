/* eslint-disable no-console */

// Intl polyfill for Hermes. Could be useless in future react-native versions. See https://hermesengine.dev/docs/intl/

import "@formatjs/intl-locale/polyfill-force";

import "@formatjs/intl-pluralrules/polyfill-force";
import "@formatjs/intl-relativetimeformat/polyfill-force";

// Dynamic language loading - only load the required language data
import { getDefaultLanguageLocale } from "./languages";
import { loadLocaleData } from "./utils/localeLoader";

// Load the default language locale data
const defaultLanguage = getDefaultLanguageLocale();
loadLocaleData(defaultLanguage);

// Fix error when adding Solana account
import "@azure/core-asynciterator-polyfill";
import { Platform } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-var-requires
global.Buffer = require("buffer").Buffer;

if (!console.assert) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.assert = () => {};
}

Promise.allSettled =
  Promise.allSettled ||
  ((promises: Promise<unknown>[]) =>
    Promise.all(
      promises.map(p =>
        p
          .then(value => ({
            status: "fulfilled",
            value,
          }))
          .catch(reason => ({
            status: "rejected",
            reason,
          })),
      ),
    ));

process.browser = true; // for readable-stream/lib/_stream_writable.js

// // Polyfill for AbortSignal.throwIfAborted on Android
const isAndroid = Platform.OS === "android";
if (isAndroid && typeof AbortSignal !== "undefined" && !AbortSignal.prototype.throwIfAborted) {
  AbortSignal.prototype.throwIfAborted = function () {
    if (this.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
  };
}

// FIXME shim want to set it to false tho...
if (__DEV__ && process.env.NODE_ENV !== "test") {
  setTimeout(() => {
    // it logs weird things without the timeout...
    try {
      // just for tests
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("react-native").LogBox.ignoreLogs([
        "Warning: isMounted(...) is deprecated in plain JavaScript React classes. Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks.",
        "Setting a timer for a long period of time, i.e. multiple minutes, is a performance and correctness issue on Android as it keeps the timer module awake, and timers can only be called when the app is in the foreground. See https://github.com/facebook/react-native/issues/12981 for more info.",
        "Warning: componentWillReceiveProps has been renamed",
        "Warning: componentWillUpdate has been renamed",
        "Warning: componentWillMount has been renamed",
        "exported from 'deprecated-react-native-prop-types'.", // https://github.com/facebook/react-native/issues/33557#issuecomment-1093083115
      ]);
    } catch (e) {
      console.warn(e);
    }
  }, 100);
}
