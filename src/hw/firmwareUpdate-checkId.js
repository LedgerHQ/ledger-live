// @flow
import { from, of, empty, concat } from "rxjs";
import { mergeMap, delay } from "rxjs/operators";

import getDeviceInfo from "../hw/getDeviceInfo";
import installOsuFirmware from "../hw/installOsuFirmware";
import { withDevice } from "../hw/deviceAccess";
import type { OsuFirmware } from "../types/manager";

const wait3s = of({ type: "wait" }).pipe(delay(3000));

export default (deviceId: string, osuFirmware: OsuFirmware) =>
  withDevice(deviceId)(transport => from(getDeviceInfo(transport))).pipe(
    mergeMap(
      deviceInfo =>
        // if in bootloader or OSU we'll directly jump to MCU step
        deviceInfo.isBootloader || deviceInfo.isOSU
          ? empty()
          : concat(
              withDevice(deviceId)(transport =>
                installOsuFirmware(transport, deviceInfo.targetId, osuFirmware)
              ),
              wait3s // the device is likely rebooting now, we give it some time
            )
    )
  );
