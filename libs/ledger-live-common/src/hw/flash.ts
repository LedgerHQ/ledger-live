import { Observable, from, of, concat, EMPTY } from "rxjs";
import { mergeMap } from "rxjs/operators";
import type { DeviceInfo, FinalFirmware, McuVersion } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";

import ManagerAPI from "../manager/api";
import { getProviderId } from "../manager/provider";
import getDeviceInfo from "./getDeviceInfo";
import { fetchMcusUseCase } from "../device/use-cases/fetchMcusUseCase";

const blVersionAliases = {
  "0.0": "0.6",
};

export default function ({ mcu_versions }: FinalFirmware) {
  return (transport: Transport): Observable<Record<string, unknown>> =>
    from(getDeviceInfo(transport)).pipe(
      mergeMap((deviceInfo: DeviceInfo) =>
        (deviceInfo.majMin in blVersionAliases
          ? of(blVersionAliases[deviceInfo.majMin])
          : from(
              fetchMcusUseCase().then((mcus: McuVersion[]) => {
                const provider = getProviderId(deviceInfo);
                const filtered = mcus.filter(
                  ({ from_bootloader_version, id, providers }: McuVersion) =>
                    providers.includes(provider) &&
                    from_bootloader_version !== "none" &&
                    mcu_versions.includes(id),
                );
                return ManagerAPI.findBestMCU(filtered);
              }),
            )
        ).pipe(
          mergeMap((mcuVersion: (McuVersion | null | undefined) | string) => {
            if (!mcuVersion) return EMPTY;
            let version: string;
            let isMCU = false;

            if (typeof mcuVersion === "string") {
              version = mcuVersion;
              log("firmware-update", `flash ${version} from mcuVersion`);
            } else {
              const mcuFromBootloader = (mcuVersion.from_bootloader_version ?? "")
                .split(".")
                .slice(0, 3)
                .join(".");
              isMCU = deviceInfo.majMin === mcuFromBootloader;
              version = isMCU ? mcuVersion.name : mcuFromBootloader;
              log("firmware-update", `flash ${version} isMcu=${isMCU}`, {
                blVersion: deviceInfo.majMin,
                mcuFromBootloader,
                version,
                isMCU,
              });
            }
            return concat(
              of({
                type: "install",
                step: `flash-${isMCU ? "mcu" : "bootloader"}`,
              }),
              ManagerAPI.installMcu(transport, "mcu", {
                targetId: deviceInfo.targetId,
                version,
              }),
            );
          }),
        ),
      ),
    );
}
