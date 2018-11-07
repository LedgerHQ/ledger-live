// @flow
// Perform a genuine check. error is fails. complete on success.
// NB potentially we could emit progress events

import Transport from "@ledgerhq/hw-transport";
import { Observable, from } from "rxjs";
import { switchMap } from "rxjs/operators";
import type { DeviceInfo } from "../../types/manager";
import ManagerAPI from "../../api/Manager";

export default (
  transport: Transport<*>,
  deviceInfo: DeviceInfo,
): Observable<string> =>
  from(
    ManagerAPI.getDeviceVersion(deviceInfo.targetId, deviceInfo.providerId),
  ).pipe(
    switchMap(deviceVersion =>
      from(
        ManagerAPI.getCurrentFirmware({
          deviceId: deviceVersion.id,
          fullVersion: deviceInfo.fullVersion,
          provider: deviceInfo.providerId,
        }),
      ),
    ),
    switchMap(firmware =>
      ManagerAPI.genuineCheck(transport, {
        targetId: deviceInfo.targetId,
        perso: firmware.perso,
      }),
    ),
  );
