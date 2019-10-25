// @flow
import { log } from "@ledgerhq/logs";
import type Transport from "@ledgerhq/hw-transport";
import { Observable, from, of, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../api/Manager";
import getDeviceInfo from "./getDeviceInfo";
import type { FinalFirmware, DeviceInfo, McuVersion } from "../types/manager";

const blVersionAliases = {
  "0.0": "0.6"
};

export default (finalFirmware: FinalFirmware) => (
  transport: Transport<*>
): Observable<*> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap(({ majMin: blVersion, targetId }: DeviceInfo) =>
      (blVersion in blVersionAliases
        ? of(blVersionAliases[blVersion])
        : from(ManagerAPI.getNextBLVersion(finalFirmware.mcu_versions[0]))
      ).pipe(
        mergeMap((mcuVersion: McuVersion | string) => {
          let version;

          let isMCU = false;
          if (typeof mcuVersion === "string") {
            version = mcuVersion;
            log("firmware-update", `flash ${version} from mcuVersion`);
          } else {
            const mcuFromBootloader = (mcuVersion.from_bootloader_version || "")
              .split(".")
              .slice(0, 2)
              .join(".");
            isMCU = blVersion === mcuFromBootloader;
            version = isMCU ? mcuVersion.name : mcuFromBootloader;
            log("firmware-update", `flash ${version} isMcu=${String(isMCU)}`, {
              blVersion,
              mcuFromBootloader,
              version,
              isMCU
            });
          }

          return concat(
            of({
              type: "install",
              step: "flash-" + (isMCU ? "mcu" : "bootloader")
            }),
            ManagerAPI.installMcu(transport, "mcu", {
              targetId,
              version
            })
          );
        })
      )
    )
  );
