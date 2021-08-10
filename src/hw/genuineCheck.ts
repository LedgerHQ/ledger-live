// Perform a genuine check. error is fails. complete on success.
import Transport from "@ledgerhq/hw-transport";
import { Observable, from } from "rxjs";
import { switchMap } from "rxjs/operators";
import type { DeviceInfo, SocketEvent } from "../types/manager";
import ManagerAPI from "../api/Manager";
import { getProviderId } from "../manager";
export default (
  transport: Transport,
  deviceInfo: DeviceInfo
): Observable<SocketEvent> =>
  from(
    ManagerAPI.getDeviceVersion(deviceInfo.targetId, getProviderId(deviceInfo))
  ).pipe(
    switchMap((deviceVersion) =>
      from(
        ManagerAPI.getCurrentFirmware({
          deviceId: deviceVersion.id,
          version: deviceInfo.version,
          provider: getProviderId(deviceInfo),
        })
      )
    ),
    switchMap((firmware) =>
      ManagerAPI.genuineCheck(transport, {
        targetId: deviceInfo.targetId,
        perso: firmware.perso,
      })
    )
  );
