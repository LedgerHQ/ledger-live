// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import "../implement-libcore";

import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

withLibcore(async core => {
  const lcore = await core.LedgerCore.newInstance();
  const stringVersion = await lcore.getStringVersion();
  const intVersion = await lcore.getIntVersion();
  console.log({ stringVersion, intVersion });
});
