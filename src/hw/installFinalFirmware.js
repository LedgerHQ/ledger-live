// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { DeviceInfo, FinalFirmware } from "../types/manager";
import { Observable, from, concat, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../api/Manager";
import getDeviceInfo from "./getDeviceInfo";

export const fetchNextFirmware = (
  deviceInfo: DeviceInfo
): Observable<FinalFirmware> =>
  from(
    ManagerAPI.getDeviceVersion(deviceInfo.targetId, deviceInfo.providerId)
  ).pipe(
    mergeMap((device) =>
      from(
        ManagerAPI.getCurrentOSU({
          deviceId: device.id,
          version: deviceInfo.version,
          provider: deviceInfo.providerId,
        })
      )
    ),

    mergeMap((firmware) =>
      from(
        ManagerAPI.getFinalFirmwareById(firmware.next_se_firmware_final_version)
      )
    )
  );

export default (transport: Transport<*>): Observable<*> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap((deviceInfo) =>
      fetchNextFirmware(deviceInfo).pipe(
        mergeMap((nextFirmware) =>
          concat(
            of({
              type: "install",
              step: "firmware",
            }),
            ManagerAPI.install(transport, "firmware", {
              targetId: deviceInfo.targetId,
              firmware: nextFirmware.firmware,
              firmwareKey: nextFirmware.firmware_key,
              perso: nextFirmware.perso,
            })
          )
        )
      )
    )
  );
