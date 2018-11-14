// @flow
import type Transport from "@ledgerhq/hw-transport";
import { Observable, from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../../api/Manager";
import getDeviceInfo from "./getDeviceInfo";

export default (transport: Transport<*>): Observable<*> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap(deviceInfo =>
      from(
        ManagerAPI.getDeviceVersion(deviceInfo.targetId, deviceInfo.providerId),
      ).pipe(
        mergeMap(device =>
          from(
            ManagerAPI.getCurrentOSU({
              deviceId: device.id,
              version: deviceInfo.fullVersion,
              provider: deviceInfo.providerId,
            }),
          ),
        ),

        mergeMap(firmware =>
          from(
            ManagerAPI.getFinalFirmwareById(
              firmware.next_se_firmware_final_version,
            ),
          ),
        ),

        mergeMap(nextFirmware =>
          ManagerAPI.install(transport, "firmware", {
            targetId: deviceInfo.targetId,
            ...nextFirmware,
            firmwareKey: nextFirmware.firmware_key,
          }),
        ),
      ),
    ),
  );
