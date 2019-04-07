// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import { from } from "rxjs";

import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";

withDevice("")(t => from(quitApp(t))).subscribe(r => console.log(r));
