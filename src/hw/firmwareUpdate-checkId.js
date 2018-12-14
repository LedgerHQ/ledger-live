// @flow
import { from, empty } from "rxjs";
import { mergeMap } from "rxjs/operators";

import getDeviceInfo from "../hw/getDeviceInfo";
import installOsuFirmware from "../hw/installOsuFirmware";
import { withDevice } from "../hw/deviceAccess";
import type { OsuFirmware } from "../types/manager";

export default (deviceId: string, latestFirmware: OsuFirmware) =>
  withDevice(deviceId)(transport => from(getDeviceInfo(transport))).pipe(
    mergeMap(
      deviceInfo =>
        // if in bootloader or OSU we'll directly jump to MCU step
        deviceInfo.isBootloader || deviceInfo.isOSU
          ? empty()
          : withDevice(deviceId)(transport =>
              installOsuFirmware(transport, deviceInfo.targetId, latestFirmware)
            )
    )
  );
