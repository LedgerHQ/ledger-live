import { log } from "@ledgerhq/logs";
import { MCUNotGenuineToDashboard } from "@ledgerhq/errors";
import { Observable, from, of, EMPTY, concat, throwError } from "rxjs";
import type { DeviceVersion, FinalFirmware } from "@ledgerhq/types-live";
import {
  concatMap,
  delay,
  filter,
  map,
  mergeMap,
  throttleTime,
} from "rxjs/operators";
import semver from "semver";
import ManagerAPI from "../api/Manager";
import { withDevicePolling, withDevice } from "./deviceAccess";
import { getProviderId } from "../manager/provider";
import getDeviceInfo from "./getDeviceInfo";
import {
  mcuOutdated,
  mcuNotGenuine,
  followDeviceRepair,
  followDeviceUpdate,
} from "../deviceWordings";
import { getDeviceRunningMode } from "./getDeviceRunningMode";

const wait2s = of({
  type: "wait",
}).pipe(delay(2000));

export const repairChoices = [
  {
    id: "mcuOutdated",
    label: mcuOutdated,
    forceMCU: "0.7",
  },
  {
    id: "mcuNotGenuine",
    label: mcuNotGenuine,
    forceMCU: "0.7",
  },
  {
    id: "followDeviceRepair",
    label: followDeviceRepair,
    forceMCU: "0.9",
  },
  {
    id: "followDeviceUpdate",
    label: followDeviceUpdate,
    forceMCU: "0.9",
  },
];

const filterMCUForDeviceInfo = (deviceInfo) => {
  const provider = getProviderId(deviceInfo);
  return (mcu) => mcu.providers.includes(provider);
};

const repair = (
  deviceId: string,
  forceMCU_?: string | null
): Observable<{
  progress: number;
}> => {
  log("hw", "firmwareUpdate-repair");
  const mcusPromise = ManagerAPI.getMcus();
  const withDeviceInfo = withDevicePolling(deviceId)(
    (transport) => from(getDeviceInfo(transport)),
    () => true // accept all errors. we're waiting forever condition that make getDeviceInfo work
  );
  const waitForBootloader = withDeviceInfo.pipe(
    concatMap((deviceInfo) =>
      deviceInfo.isBootloader ? EMPTY : concat(wait2s, waitForBootloader)
    )
  );

  const loop = (forceMCU?: string | null | undefined) =>
    concat(
      withDeviceInfo.pipe(
        concatMap((deviceInfo) => {
          const installMcu = (version: string) =>
            withDevice(deviceId)((transport) =>
              ManagerAPI.installMcu(transport, "mcu", {
                targetId: deviceInfo.targetId,
                version,
              })
            );

          if (!deviceInfo.isBootloader) {
            // finish earlier
            return EMPTY;
          }

          // This is a special case where user is in firmware 1.3.1
          // and the device shows MCU Not Genuine.
          // User needs to press both keys three times to go back to dashboard
          // and continue the update process
          if (
            forceMCU &&
            forceMCU === "0.7" &&
            (deviceInfo.majMin === "0.6" || deviceInfo.majMin === "0.7")
          ) {
            // finish earlier
            return throwError(new MCUNotGenuineToDashboard());
          }

          if (forceMCU) {
            return concat(installMcu(forceMCU), wait2s, loop());
          }

          switch (deviceInfo.majMin) {
            case "0.0":
              return concat(installMcu("0.6"), wait2s, loop());

            case "0.6":
              return installMcu("1.5");

            case "0.7":
              return installMcu("1.6");

            case "0.9":
              return installMcu("1.7");

            default:
              return from(mcusPromise).pipe(
                concatMap((mcus) => {
                  let next;
                  const { seVersion, seTargetId, mcuBlVersion } = deviceInfo;

                  // This is a special case where a user with LNX version >= 2.0.0
                  // comes back with a broken updated device. We need to be able
                  // to patch MCU or Bootloader if needed
                  if (seVersion && seTargetId) {
                    log(
                      "hw",
                      "firmwareUpdate-repair seVersion and seTargetId found",
                      { seVersion, seTargetId }
                    );
                    const validMcusForDeviceInfo = mcus
                      .filter(filterMCUForDeviceInfo(deviceInfo))
                      .filter((mcu) => mcu.from_bootloader_version !== "none");

                    log("hw", "firmwareUpdate-repair valid mcus for device", {
                      validMcusForDeviceInfo,
                    });

                    return from(
                      ManagerAPI.getDeviceVersion(
                        seTargetId,
                        getProviderId(deviceInfo)
                      )
                    ).pipe(
                      mergeMap((deviceVersion: DeviceVersion) =>
                        from(
                          ManagerAPI.getCurrentFirmware({
                            deviceId: deviceVersion.id,
                            version: seVersion,
                            provider: getProviderId(deviceInfo),
                          })
                        )
                      ),
                      mergeMap((finalFirmware: FinalFirmware) => {
                        log("hw", "firmwareUpdate-repair got final firmware", {
                          finalFirmware,
                        });

                        const mcu = ManagerAPI.findBestMCU(
                          finalFirmware.mcu_versions
                            .map((id) =>
                              validMcusForDeviceInfo.find(
                                (mcu) => mcu.id === id
                              )
                            )
                            .filter(Boolean)
                        );

                        log("hw", "firmwareUpdate-repair got mcu", { mcu });

                        if (!mcu) return EMPTY;
                        const expectedBootloaderVersion = semver.coerce(
                          mcu.from_bootloader_version
                        )?.version;
                        const currentBootloaderVersion =
                          semver.coerce(mcuBlVersion)?.version;

                        log("hw", "firmwareUpdate-repair bootloader versions", {
                          currentBootloaderVersion,
                          expectedBootloaderVersion,
                        });

                        if (
                          expectedBootloaderVersion === currentBootloaderVersion
                        ) {
                          next = mcu;
                          log(
                            "hw",
                            "firmwareUpdate-repair bootloader versions are the same",
                            { next }
                          );
                        } else {
                          next = {
                            name: mcu.from_bootloader_version,
                          };
                          log(
                            "hw",
                            "firmwareUpdate-repair bootloader versions are different",
                            { next }
                          );
                        }

                        return installMcu(next.name);
                      })
                    );
                  } else {
                    next = ManagerAPI.findBestMCU(
                      ManagerAPI.compatibleMCUForDeviceInfo(
                        mcus,
                        deviceInfo,
                        getProviderId(deviceInfo)
                      )
                    );

                    if (next) return installMcu(next.name);
                  }

                  return EMPTY;
                })
              );
          }
        })
      ),
      from(
        getDeviceRunningMode({
          deviceId,
          unresponsiveTimeoutMs: 4000,
          cantOpenDeviceRetryLimit: 2,
        })
      ).pipe(
        mergeMap((result) => {
          if (result.type === "bootloaderMode") {
            return loop(forceMCU);
          } else {
            return EMPTY;
          }
        })
      )
    );

  // TODO ideally we should race waitForBootloader with an event "display-bootloader-reboot", it should be a delayed event that is not emitted if waitForBootloader is fast enough..
  return concat(waitForBootloader, loop(forceMCU_)).pipe(
    filter((e: any) => e.type === "bulk-progress"),
    map((e) => ({
      progress: e.progress,
    })),
    throttleTime(100)
  );
};

export default repair;
