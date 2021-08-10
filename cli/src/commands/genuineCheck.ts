import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import { deviceOpt } from "../scan";
export default {
  description: "Perform a genuine check with Ledger's HSM",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) =>
    withDevice(device || "")((t) =>
      from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo) => genuineCheck(t, deviceInfo))
      )
    ),
};
