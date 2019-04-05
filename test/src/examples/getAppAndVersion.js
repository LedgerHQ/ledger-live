// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import { from } from "rxjs";

import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";

withDevice("")(t => from(getAppAndVersion(t))).subscribe(r => console.log(r));
