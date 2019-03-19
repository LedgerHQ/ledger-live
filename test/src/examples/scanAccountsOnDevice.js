// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { scanAccountsOnDevice } from "@ledgerhq/live-common/lib/libcore/scanAccountsOnDevice";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";

scanAccountsOnDevice(getCryptoCurrencyById("bitcoin"), "").subscribe({
  next: event => {
    console.log(event);
  },
  error: e => {
    console.error(e);
    process.exit(1);
  },
  complete: () => {}
});
