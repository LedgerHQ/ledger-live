// CORE JS polyfills only

/* eslint-disable no-console */

// Intl polyfill for Hermes. Could be useless in future react-native versions. See https://hermesengine.dev/docs/intl/

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
