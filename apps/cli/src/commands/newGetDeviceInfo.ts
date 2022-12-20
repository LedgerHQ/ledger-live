import { getDeviceInfoAction } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo"; 
import { deviceOpt } from "../scan";

export default {
  description: "Get device info",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) =>
    getDeviceInfoAction({
      deviceId: device ?? "",
    }),
};
