import { from } from "rxjs";
import type { ScanCommonOpts } from "../../scan";
import { command as customLockScreenRemove } from "@ledgerhq/live-common/hw/customLockScreenRemove";
import { deviceOpt } from "../../scan";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

export type CustomLockScreenRemoveJobOpts = ScanCommonOpts;

export default {
  description: "Remove custom lock screen",
  args: [deviceOpt],
  job: (arg: CustomLockScreenRemoveJobOpts): any =>
    withDevice(arg?.device || "")(t => from(customLockScreenRemove(t))),
};
