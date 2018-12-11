// @flow
// Perform a genuine check. error is fails. complete on success.

import Transport from "@ledgerhq/hw-transport";
import { Observable, from, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import type { DeviceInfo } from "../types/manager";
import ManagerAPI from "../api/Manager";

export default (
  transport: Transport<*>,
  deviceInfo: DeviceInfo
): Observable<string> =>
  deviceInfo.isOSU || deviceInfo.isBootloader
    ? of("9000")
    : from(
        ManagerAPI.getDeviceVersion(deviceInfo.targetId, deviceInfo.providerId)
      ).pipe(
        switchMap(deviceVersion =>
          from(
            ManagerAPI.getCurrentFirmware({
              deviceId: deviceVersion.id,
              fullVersion: deviceInfo.fullVersion,
              provider: deviceInfo.providerId
            })
          )
        ),
        switchMap(firmware =>
          ManagerAPI.genuineCheck(transport, {
            targetId: deviceInfo.targetId,
            perso: firmware.perso
          })
        )
      );
