/* eslint-disable no-console */
import "@formatjs/intl-getcanonicallocales/polyfill";

import "@formatjs/intl-locale/polyfill";

import "@formatjs/intl-pluralrules/polyfill";
import "@formatjs/intl-pluralrules/locale-data/en";
import "@formatjs/intl-pluralrules/locale-data/fr";
import "@formatjs/intl-pluralrules/locale-data/es";
import "@formatjs/intl-pluralrules/locale-data/ru";
import "@formatjs/intl-pluralrules/locale-data/zh";
import "@formatjs/intl-pluralrules/locale-data/de";
import "@formatjs/intl-pluralrules/locale-data/tr";
import "@formatjs/intl-pluralrules/locale-data/ja";
import "@formatjs/intl-pluralrules/locale-data/ko";

import "@formatjs/intl-numberformat/polyfill";
import "@formatjs/intl-numberformat/locale-data/en";
import "@formatjs/intl-numberformat/locale-data/fr";
import "@formatjs/intl-numberformat/locale-data/es";
import "@formatjs/intl-numberformat/locale-data/ru";
import "@formatjs/intl-numberformat/locale-data/zh";
import "@formatjs/intl-numberformat/locale-data/de";
import "@formatjs/intl-numberformat/locale-data/tr";
import "@formatjs/intl-numberformat/locale-data/ja";
import "@formatjs/intl-numberformat/locale-data/ko";

import "@formatjs/intl-datetimeformat/polyfill";
import "@formatjs/intl-datetimeformat/locale-data/en";
import "@formatjs/intl-datetimeformat/locale-data/fr";
import "@formatjs/intl-datetimeformat/locale-data/es";
import "@formatjs/intl-datetimeformat/locale-data/ru";
import "@formatjs/intl-datetimeformat/locale-data/zh";
import "@formatjs/intl-datetimeformat/locale-data/de";
import "@formatjs/intl-datetimeformat/locale-data/tr";
import "@formatjs/intl-datetimeformat/locale-data/ja";
import "@formatjs/intl-datetimeformat/locale-data/ko";
import "@formatjs/intl-datetimeformat/add-all-tz";

import "@formatjs/intl-relativetimeformat/polyfill";
import "@formatjs/intl-relativetimeformat/locale-data/en";
import "@formatjs/intl-relativetimeformat/locale-data/fr";
import "@formatjs/intl-relativetimeformat/locale-data/es";
import "@formatjs/intl-relativetimeformat/locale-data/ru";
import "@formatjs/intl-relativetimeformat/locale-data/zh";
import "@formatjs/intl-relativetimeformat/locale-data/de";
import "@formatjs/intl-relativetimeformat/locale-data/tr";
import "@formatjs/intl-relativetimeformat/locale-data/ja";
import "@formatjs/intl-relativetimeformat/locale-data/ko";

// Fix error when adding Solana account
import "@azure/core-asynciterator-polyfill";

// eslint-disable-next-line @typescript-eslint/no-var-requires
global.Buffer = require("buffer").Buffer;

if (!console.assert) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.assert = () => {};
}

process.browser = true; // for readable-stream/lib/_stream_writable.js

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
