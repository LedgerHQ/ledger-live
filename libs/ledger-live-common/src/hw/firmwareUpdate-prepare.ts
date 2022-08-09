import { log } from "@ledgerhq/logs";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Observable, from, of, concat, throwError } from "rxjs";
import { mergeMap, delay, filter, map } from "rxjs/operators";
import { DeviceOnDashboardExpected } from "@ledgerhq/errors";
import getDeviceInfo from "./getDeviceInfo";
import installOsuFirmware from "./installOsuFirmware";
import { withDevice } from "./deviceAccess";

const waitEnd = of({
  type: "wait",
}).pipe(delay(3000));

const checkId = (
  deviceId: string,
  { osu }: FirmwareUpdateContext
): Observable<{
  progress: number;
  displayedOnDevice: boolean;
}> => {
  log("hw", "firmwareUpdate-prepare");
  return withDevice(deviceId)((transport) =>
    from(getDeviceInfo(transport))
  ).pipe(
    mergeMap(
      (
        deviceInfo // if in bootloader or OSU we'll directly jump to MCU step
      ) =>
        deviceInfo.isBootloader || deviceInfo.isOSU
          ? throwError(new DeviceOnDashboardExpected())
          : concat(
              withDevice(deviceId)((transport) =>
                installOsuFirmware(transport, deviceInfo.targetId, osu)
              ),
              waitEnd // the device is likely rebooting now, we give it some time
            )
    ),
    filter((e) => e.type === "bulk-progress"),
    map((e) => ({
      progress: e.progress,
      displayedOnDevice: e.index >= e.total - 1,
    }))
  );
};

export default checkId;
