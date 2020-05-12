// @flow
import { log } from "@ledgerhq/logs";
import type Transport from "@ledgerhq/hw-transport";
import { Observable, from, of, concat, empty } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../api/Manager";
import getDeviceInfo from "./getDeviceInfo";
import type { FinalFirmware, DeviceInfo, McuVersion } from "../types/manager";

const blVersionAliases = {
  "0.0": "0.6",
};

export default (finalFirmware: FinalFirmware) => (
  transport: Transport<*>
): Observable<*> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap(({ majMin: blVersion, targetId }: DeviceInfo) =>
      (blVersion in blVersionAliases
        ? of(blVersionAliases[blVersion])
        : from(
            // we pick the best MCU to install in the context of the firmware
            ManagerAPI.getMcus().then((mcus) =>
              ManagerAPI.findBestMCU(
                finalFirmware.mcu_versions
                  .map((id) => mcus.find((mcu) => mcu.id === id))
                  .filter(Boolean)
              )
            )
          )
      ).pipe(
        mergeMap((mcuVersion: ?McuVersion | string) => {
          if (!mcuVersion) return empty();
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
              isMCU,
            });
          }

          return concat(
            of({
              type: "install",
              step: "flash-" + (isMCU ? "mcu" : "bootloader"),
            }),
            ManagerAPI.installMcu(transport, "mcu", {
              targetId,
              version,
            })
          );
        })
      )
    )
  );
