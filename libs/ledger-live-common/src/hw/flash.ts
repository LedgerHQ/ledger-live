import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import { Observable, from, of, concat, EMPTY } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../api/Manager";
import { getProviderId } from "../manager/provider";
import getDeviceInfo from "./getDeviceInfo";
import type {
  DeviceInfo,
  FinalFirmware,
  McuVersion,
} from "@ledgerhq/types-live";
const blVersionAliases = {
  "0.0": "0.6",
};

const filterMCUForDeviceInfo = (deviceInfo) => {
  const provider = getProviderId(deviceInfo);
  return (mcu) => mcu.providers.includes(provider);
};

export default (finalFirmware: FinalFirmware) =>
  (transport: Transport): Observable<any> =>
    from(getDeviceInfo(transport)).pipe(
      mergeMap((deviceInfo: DeviceInfo) =>
        (deviceInfo.majMin in blVersionAliases
          ? of(blVersionAliases[deviceInfo.majMin])
          : from(
              // we pick the best MCU to install in the context of the firmware
              ManagerAPI.getMcus()
                .then((mcus) => mcus.filter(filterMCUForDeviceInfo(deviceInfo)))
                .then((mcus) =>
                  mcus.filter((mcu) => mcu.from_bootloader_version !== "none")
                )
                .then((mcus) =>
                  ManagerAPI.findBestMCU(
                    finalFirmware.mcu_versions
                      .map((id) => mcus.find((mcu) => mcu.id === id))
                      .filter(Boolean)
                  )
                )
            )
        ).pipe(
          mergeMap((mcuVersion: (McuVersion | null | undefined) | string) => {
            if (!mcuVersion) return EMPTY;
            let version;
            let isMCU = false;

            if (typeof mcuVersion === "string") {
              version = mcuVersion;
              log("firmware-update", `flash ${version} from mcuVersion`);
            } else {
              const mcuFromBootloader = (
                mcuVersion.from_bootloader_version || ""
              )
                .split(".")
                .slice(0, 2)
                .join(".");
              isMCU = deviceInfo.majMin === mcuFromBootloader;
              version = isMCU ? mcuVersion.name : mcuFromBootloader;
              log(
                "firmware-update",
                `flash ${version} isMcu=${String(isMCU)}`,
                {
                  blVersion: deviceInfo.majMin,
                  mcuFromBootloader,
                  version,
                  isMCU,
                }
              );
            }

            return concat(
              of({
                type: "install",
                step: "flash-" + (isMCU ? "mcu" : "bootloader"),
              }),
              ManagerAPI.installMcu(transport, "mcu", {
                targetId: deviceInfo.targetId,
                version,
              })
            );
          })
        )
      )
    );
