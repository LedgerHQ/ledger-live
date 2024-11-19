import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type DeviceInfoJobOpts = DeviceCommonOpts;

export default {
  args: [deviceOpt],
  job: ({ device }: DeviceInfoJobOpts) => withDevice(device || "")(t => from(getDeviceInfo(t))),
};
