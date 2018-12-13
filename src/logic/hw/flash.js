// @flow
import type Transport from "@ledgerhq/hw-transport";
import { Observable, from, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../../api/Manager";
import getDeviceInfo from "./getDeviceInfo";
import type { FinalFirmware, DeviceInfo } from "../../types/manager";

const blVersionAliases = {
  "0.0": "0.6",
  "0.0.0": "0.6",
};

export default (nextFirmaware: FinalFirmware) => (
  transport: Transport<*>,
): Observable<*> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap(({ seVersion: blVersion, targetId }: DeviceInfo) =>
      (blVersion in blVersionAliases
        ? of(blVersionAliases[blVersion])
        : from(ManagerAPI.getNextBLVersion(nextFirmaware.mcu_versions[0]))
      ).pipe(
        mergeMap(mcuVersion =>
          ManagerAPI.installMcu(transport, "mcu", {
            targetId,
            version:
              blVersion === mcuVersion.from_bootloader_version
                ? mcuVersion.name
                : mcuVersion.from_bootloader_version,
          }),
        ),
      ),
    ),
  );
