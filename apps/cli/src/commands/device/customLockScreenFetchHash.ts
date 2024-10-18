/* eslint-disable no-console */
import { from } from "rxjs";
import type { ScanCommonOpts } from "../../scan";
import { deviceOpt } from "../../scan";
import customLockScreenFetchHash from "@ledgerhq/live-common/hw/customLockScreenFetchHash";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

export type CustomLockScreenFetchHashJobOpts = ScanCommonOpts;

export default {
  description: "Fetch the hash of the custom lock screen",
  args: [deviceOpt],
  job: (arg: CustomLockScreenFetchHashJobOpts): any =>
    withDevice(arg.device || "")(t => from(customLockScreenFetchHash(t))),
};
