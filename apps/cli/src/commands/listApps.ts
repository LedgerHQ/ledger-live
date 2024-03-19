import { from, tap } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import listApps from "@ledgerhq/live-common/hw/listApps";
import { deviceOpt } from "../scan";

export default {
  description: "list all installed apps on the device",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) =>
    withDevice(device || "")(t =>
      from(listApps(t)).pipe(
        tap(res => {
          console.log(res);
        }),
      ),
    ),
};
