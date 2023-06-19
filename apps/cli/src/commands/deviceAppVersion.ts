import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";
import { deviceOpt } from "../scan";
export default {
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) => withDevice(device || "")(t => from(getAppAndVersion(t))),
};
