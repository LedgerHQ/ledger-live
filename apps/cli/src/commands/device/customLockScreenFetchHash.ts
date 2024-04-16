/* eslint-disable no-console */
import { from } from "rxjs";
import type { ScanCommonOpts } from "../../scan";
import { deviceOpt } from "../../scan";
import customLockScreenFetchHash from "@ledgerhq/live-common/hw/customLockScreenFetchHash";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

export default {
  description: "Fetch the hash of the custom lock screen",
  args: [deviceOpt],
  job: (arg: ScanCommonOpts): any =>
    withDevice(arg.device || "")(t => from(customLockScreenFetchHash(t))),
};
