import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import genuineCheck from "@ledgerhq/live-common/hw/genuineCheck";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type GenuineCheckJobArgs = DeviceCommonOpts;

export default {
  description: "Perform a genuine check with Ledger's HSM",
  args: [deviceOpt],
  job: ({ device }: GenuineCheckJobArgs) =>
    withDevice(device || "")(t =>
      from(getDeviceInfo(t)).pipe(mergeMap(deviceInfo => genuineCheck(t, deviceInfo))),
    ),
};
