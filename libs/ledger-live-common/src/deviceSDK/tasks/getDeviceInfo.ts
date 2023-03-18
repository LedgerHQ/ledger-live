import { DisconnectedDevice, LockedDeviceError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { DeviceId, DeviceInfo } from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";

import isDevFirmware from "../../hw/isDevFirmware";
import { PROVIDERS } from "../../manager/provider";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  SharedTaskEvent,
  retryOnErrorsCommandWrapper,
  sharedLogicTaskWrapper,
} from "./core";
import { quitApp } from "../commands/quitApp";
import { withTransport } from "../transports/core";

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export type GetDeviceInfoTaskArgs = { deviceId: DeviceId };

// No taskError for getDeviceInfoTask. Kept for consistency with other tasks.
export type GetDeviceInfoTaskError = "None";

export type GetDeviceInfoTaskErrorEvent = {
  type: "taskError";
  error: GetDeviceInfoTaskError;
};

export type GetDeviceInfoTaskEvent =
  | { type: "data"; deviceInfo: DeviceInfo }
  | GetDeviceInfoTaskErrorEvent
  | SharedTaskEvent;

function internalGetDeviceInfoTask({
  deviceId,
}: GetDeviceInfoTaskArgs): Observable<GetDeviceInfoTaskEvent> {
  return new Observable((subscriber) => {
    return (
      withTransport(deviceId)(({ transportRef }) =>
        quitApp(transportRef.current).pipe(
          switchMap(() => {
            return retryOnErrorsCommandWrapper({
              command: getVersion,
              allowedErrors: [
                { maxRetries: 3, errorClass: DisconnectedDevice },
              ],
            })(transportRef, {});
          }),
          map((value) => {
            if (value.type === "unresponsive") {
              return { type: "error" as const, error: new LockedDeviceError() };
            }

            const { firmwareInfo } = value;

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
            } = firmwareInfo;

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

            return { type: "data" as const, deviceInfo };
          })
        )
      )
        // Any error will be handled by the sharedLogicTaskWrapper, which will map it a relevant event
        .subscribe(subscriber)
    );
  });
}

export const getDeviceInfoTask = sharedLogicTaskWrapper(
  internalGetDeviceInfoTask
);
