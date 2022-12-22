import { DeviceOnDashboardExpected } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { DeviceId, DeviceInfo } from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";
import { getAppAndVersion } from "../commands/getAppAndVersion";

import isDevFirmware from "../../hw/isDevFirmware";
import { isDashboardName } from "../../hw/isDashboardName";
import { withDevice } from "../../hw/deviceAccess";
import { PROVIDERS } from "../../manager/provider";
import { Observable } from "rxjs";
import { map, filter, switchMap } from "rxjs/operators";
import { GeneralTaskEvent, wrappedTask } from "./core";

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export type GetDeviceInfoTaskArgs = { deviceId: DeviceId };

// TODO: check if there's a way to be more specific than that
// It shoould be: DeviceOnDashboardExpected
export type GetDeviceInfoTaskError = Error;

export type GetDeviceInfoTaskEvent =
  | { type: "data"; deviceInfo: DeviceInfo }
  | { type: "taskError"; error: GetDeviceInfoTaskError }
  | GeneralTaskEvent;

function internalGetDeviceInfoTask({
  deviceId,
}: GetDeviceInfoTaskArgs): Observable<GetDeviceInfoTaskEvent> {
  return new Observable((subscriber) => {
    withDevice(deviceId)((transport) =>
      getAppAndVersion(transport).pipe(
        filter(({ name }) => {
          if (!isDashboardName(name)) {
            subscriber.next({
              type: "taskError",
              error: new DeviceOnDashboardExpected(),
            });
            return false;
          }
          return true;
        }),
        switchMap(() => {
          return getVersion(transport);
        }),

        map((value) => {
          const {
            isBootloader,
            rawVersion,
            targetId,
            seVersion,
            seTargetId,
            mcuBlVersion,
            mcuVersion,
            mcuTargetId,
            flags,
            bootloaderVersion,
            hardwareVersion,
            languageId,
          } = value;

          const isOSU = rawVersion.includes("-osu");
          const version = rawVersion.replace("-osu", "");
          const m = rawVersion.match(/([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/);
          const [, majMin, , , postDash] = m || [];
          const providerName = PROVIDERS[postDash] ? postDash : null;
          const flag = flags.length > 0 ? flags[0] : 0;
          const managerAllowed = !!(flag & ManagerAllowedFlag);
          const pinValidated = !!(flag & PinValidatedFlag);

          let isRecoveryMode = false;
          let onboarded = true;
          if (flags.length === 4) {
            // Nb Since LNS+ unseeded devices are visible + extra flags
            isRecoveryMode = !!(flags[0] & 0x01);
            onboarded = !!(flags[0] & 0x04);
          }

          log(
            "hw",
            "deviceInfo: se@" +
              version +
              " mcu@" +
              mcuVersion +
              (isOSU ? " (osu)" : isBootloader ? " (bootloader)" : "")
          );

          const hasDevFirmware = isDevFirmware(seVersion);
          const deviceInfo: DeviceInfo = {
            version,
            mcuVersion,
            seVersion,
            mcuBlVersion,
            majMin,
            providerName: providerName || null,
            targetId,
            hasDevFirmware,
            seTargetId,
            mcuTargetId,
            isOSU,
            isBootloader,
            isRecoveryMode,
            managerAllowed,
            pinValidated,
            onboarded,
            bootloaderVersion,
            hardwareVersion,
            languageId,
          };

          return deviceInfo;
        })
      )
    ).subscribe({
      next: (deviceInfo) => subscriber.next({ type: "data", deviceInfo }),
      error: (error) => subscriber.error(error), // subscriber.next({ type: "error", error }),
      complete: () => subscriber.complete(),
    });
  });
}

export const getDeviceInfoTask = wrappedTask(internalGetDeviceInfoTask);
