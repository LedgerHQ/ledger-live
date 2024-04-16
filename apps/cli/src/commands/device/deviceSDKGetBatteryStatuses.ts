import { Observable } from "rxjs";
import { getBatteryStatusesAction } from "@ledgerhq/live-common/deviceSDK/actions/getBatteryStatuses";
import { deviceOpt } from "../../scan";
import { BatteryStatusTypes } from "@ledgerhq/live-common/hw/getBatteryStatus";

export default {
  description: "Device SDK: get battery statuses",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) => {
    return new Observable(o => {
      return getBatteryStatusesAction({
        deviceId: device ?? "",
        statuses: [
          BatteryStatusTypes.BATTERY_CURRENT,
          BatteryStatusTypes.BATTERY_FLAGS,
          BatteryStatusTypes.BATTERY_PERCENTAGE,
          BatteryStatusTypes.BATTERY_TEMPERATURE,
          BatteryStatusTypes.BATTERY_VOLTAGE,
        ],
      }).subscribe(o);
    });
  },
};
