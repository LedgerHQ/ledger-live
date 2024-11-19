import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type DeviceAppVersionJobOpts = DeviceCommonOpts;

export default {
  args: [deviceOpt],
  job: ({ device }: DeviceAppVersionJobOpts) =>
    withDevice(device || "")(t => from(getAppAndVersion(t))),
};
