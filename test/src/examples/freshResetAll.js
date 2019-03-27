// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

withLibcore(async core => {
  await core.getPoolInstance().freshResetAll();
  console.log("freshResetAll!");
});
