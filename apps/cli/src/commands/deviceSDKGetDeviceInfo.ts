import { Observable } from "rxjs";
import { getDeviceInfoAction } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo"; 
import { deviceOpt } from "../scan";

export default {
  description: "Device SDK: get device info",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) => {
    return new Observable(o => {
      return getDeviceInfoAction({
        deviceId: device ?? "",
      }).subscribe(o);
    })
  }
};
