import Transport from "@ledgerhq/hw-transport";
import { Observable, from, concat, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../api/Manager";
import getDeviceInfo from "./getDeviceInfo";
import { getProviderId } from "../manager";
import type { DeviceInfo, FinalFirmware } from "@ledgerhq/types-live";
export const fetchNextFirmware = (
  deviceInfo: DeviceInfo
): Observable<FinalFirmware> =>
  from(
    ManagerAPI.getDeviceVersion(deviceInfo.targetId, getProviderId(deviceInfo))
  ).pipe(
    mergeMap((device) =>
      from(
        ManagerAPI.getCurrentOSU({
          deviceId: device.id,
          version: deviceInfo.version,
          provider: getProviderId(deviceInfo),
        })
      )
    ),
    mergeMap((firmware) =>
      from(
        ManagerAPI.getFinalFirmwareById(firmware.next_se_firmware_final_version)
      )
    )
  );
export default (transport: Transport): Observable<any> =>
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
