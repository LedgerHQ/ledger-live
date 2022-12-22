import { getDeviceInfoAction } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo"; 
import { Observable } from "rxjs";
import { deviceOpt } from "../scan";

export default {
  description: "Get device info",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) => {
    return new Observable(o => {
      return getDeviceInfoAction({
        deviceId: device ?? "",
      }).subscribe({
        next: (value) => {
          console.log(`🦄 cli next`);
          o.next(value);
        },
        error: (e) => {
          console.log(`🦄 cli error`);
          o.error(e);
        },
        complete: () => {
          console.log(`🦄 cli complete !`);
          o.complete();
        }
      })
    })
  }
};
