import { Observable, from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getBatteryStatus, { BatteryStatusTypes } from "@ledgerhq/live-common/hw/getBatteryStatus";
import { currencyOpt, DeviceCommonOpts, deviceOpt } from "../../scan";

export type GetBatteryStatusJobOpts = DeviceCommonOpts & Partial<{ p2: string }>;

export default {
  description: "Get the battery status of the current device",
  args: [
    currencyOpt,
    deviceOpt,
    {
      name: "p2",
      type: String,
      desc: "What type of request to run (00-04)",
    },
  ],
  job: (arg: GetBatteryStatusJobOpts): Observable<number[]> =>
    withDevice(arg.device || "")(t =>
      from(getBatteryStatus(t, [parseInt(arg.p2 || "0") as BatteryStatusTypes])),
    ),
};
