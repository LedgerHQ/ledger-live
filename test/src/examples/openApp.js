// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import { from } from "rxjs";

import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";

const name = process.argv[2];
withDevice("")(t => from(openApp(t, name))).subscribe({
  next: r => console.log(r),
  error: e => console.error(e)
});
