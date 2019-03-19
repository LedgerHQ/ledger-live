// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

isValidRecipient({
  currency: getCryptoCurrencyById("bitcoin"),
  recipient: "1NtocLbFFPYPNGeEsDn2CYY4GbfLGLpTFr"
}).then(
  () => {
    console.log("success valid address");
  },
  e => {
    console.error(e);
    process.exit(1);
  }
);

isValidRecipient({
  currency: getCryptoCurrencyById("bitcoin"),
  recipient: "1NtocLbFYY4GbfLGLpTFr"
}).then(
  () => {
    console.error("false positive!");
    process.exit(1);
  },
  e => {
    console.log("success detect invalid address (" + e.name + ")");
  }
);
