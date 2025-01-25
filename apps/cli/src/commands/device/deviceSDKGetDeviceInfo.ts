import { Observable } from "rxjs";
import { getDeviceInfoAction } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type DeviceSDKGetDeviceInfoJobOpts = DeviceCommonOpts;

export default {
  description: "Device SDK: get device info",
  args: [deviceOpt],
  job: ({ device }: DeviceSDKGetDeviceInfoJobOpts) => {
    return new Observable(o => {
      return getDeviceInfoAction({
        deviceId: device ?? "",
      }).subscribe(o);
    });
  },
};
