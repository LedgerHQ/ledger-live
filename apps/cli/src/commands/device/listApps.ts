import { from, tap } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import listApps from "@ledgerhq/live-common/hw/listApps";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type ListAppsJobOpts = DeviceCommonOpts;

export default {
  description: "list all installed apps on the device",
  args: [deviceOpt],
  job: ({ device }: ListAppsJobOpts) =>
    withDevice(device || "")(t =>
      from(listApps(t)).pipe(
        tap(res => {
          console.log(res);
        }),
      ),
    ),
};
