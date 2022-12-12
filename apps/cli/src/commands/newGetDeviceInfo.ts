import { getDeviceInfo, GetDeviceInfoTaskEvent  } from "@ledgerhq/live-common/deviceSDK/tasks/getDeviceInfo"; 
import { deviceOpt } from "../scan";

export default {
  description: "Get device info",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) =>
    getDeviceInfo({
      deviceId: device ?? "",
    }),
};
