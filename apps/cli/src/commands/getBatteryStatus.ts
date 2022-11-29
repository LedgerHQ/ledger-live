import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getBatteryStatus, { BatteryStatusTypes } from "@ledgerhq/live-common/hw/getBatteryStatus";
import { currencyOpt, deviceOpt, inferCurrency } from "../scan";
export default {
  description:
    "Get the battery status of the current device",
  args: [
    currencyOpt,
    deviceOpt,
    {
      name: "p1",
      type: String,
      desc: "What type of request to run (00-04)",
    },
  ],
  job: (
    arg: Partial<{
      device: string;
      p1: string;
    }>
  ): any =>
    withDevice(arg.device || "")((t) => from(getBatteryStatus(t, parseInt(arg.p1 || "0") as BatteryStatusTypes)))
};
