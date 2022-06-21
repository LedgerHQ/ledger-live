import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getVersion from "@ledgerhq/live-common/lib/hw/getVersion";
import { deviceOpt } from "../scan";
export default {
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) => withDevice(device || "")((t) => from(getVersion(t))),
};
