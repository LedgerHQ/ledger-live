import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { deviceOpt } from "../scan";
export default {
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) => withDevice(device || "")((t) => from(getDeviceInfo(t))),
};
