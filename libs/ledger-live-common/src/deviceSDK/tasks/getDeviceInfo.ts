import {
  DeviceOnDashboardExpected,
  TransportStatusError,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { DeviceId, DeviceInfo } from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";
import { getAppAndVersion } from "../commands/getAppAndVersion";

import isDevFirmware from "../../hw/isDevFirmware";
import { isDashboardName } from "../../hw/isDashboardName";
import { withDevice } from "../../hw/deviceAccess";
import { PROVIDERS } from "../../manager/provider";
import { DeviceNotOnboarded } from "../../errors";
import { Observable, of } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export type GetDeviceInfoTaskArgs = { deviceId: DeviceId };
export type GetDeviceInfoTaskEvent = Observable<DeviceInfo>;

// Implementation with new Observable: easier to read ?
// BUT: does not work currently because 2nd subscribe does not wait for 1st subscribe to complete
// Fix: subscribe to 1st, and on complete start the 2nd command -> but indentation hell
export function getDeviceInfo({
  deviceId,
}: GetDeviceInfoTaskArgs): GetDeviceInfoTaskEvent {
  return withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        getAppAndVersion(transport)
          .pipe(
            switchMap(({ name }) => {
              return of(isDashboardName(name));
            }),
            catchError((e) => {
              if (e instanceof TransportStatusError) {
                // @ts-expect-error typescript not checking agains the instanceof
                if (e.statusCode === 0x6e00) {
                  return of(true);
                }

                // @ts-expect-error typescript not checking agains the instanceof
                if (e.statusCode === 0x6d00) {
                  return of(false);
                }
              }

              throw e;
            })
          )
          .subscribe({
            next: (probablyOnDashboard) => {
              if (!probablyOnDashboard) {
                o.error(new DeviceOnDashboardExpected());
              }
            },
            error: (e) => {
              console.log(`🚨 1st obs error: ${JSON.stringify(e)}`);
              o.error(e);
            },
            complete: () => {
              getVersion(transport)
                .pipe(
                  switchMap((value) => {
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
                    const m = rawVersion.match(
                      /([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/
                    );
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

                    return of({
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
                    });
                  })
                )
                .subscribe({
                  next: (value) => {
                    o.next(value);
                  },
                  error: (e) => {
                    // TODO: don't know if should handle it here
                    if (e instanceof TransportStatusError) {
                      // @ts-expect-error typescript not checking agains the instanceof
                      if (e.statusCode === 0x6d06) {
                        o.error(DeviceNotOnboarded());
                      }
                    }

                    console.log(`🚨 2st obs error: ${JSON.stringify(e)}`);
                    o.error(e);
                  },
                  complete: () => o.complete(),
                });
            },
          });
      })
  );
}

// Implementation full pipe: harder to read ?
// Actually pipe does not wait to start () => getVersion(transport) ?!
export function getDeviceInfo2({
  deviceId,
}: GetDeviceInfoTaskArgs): GetDeviceInfoTaskEvent {
  return withDevice(deviceId)((transport) =>
    // getAppAndVersion(transport).pipe(
    //   switchMap(({ name }) => {
    //     return of(isDashboardName(name));
    //   }),
    //   catchError((e) => {
    //     if (e instanceof TransportStatusError) {
    //       // @ts-expect-error typescript not checking agains the instanceof
    //       if (e.statusCode === 0x6e00) {
    //         return of(true);
    //       }

    //       // @ts-expect-error typescript not checking agains the instanceof
    //       if (e.statusCode === 0x6d00) {
    //         return of(false);
    //       }
    //     }

    //     throw e;
    //   }),
    //   switchMap((probablyOnDashboard) => {
    //     if (!probablyOnDashboard) {
    //       throw new DeviceOnDashboardExpected();
    //     }

    //     return of(true);
    //   }),
    // () => getVersion(transport),
    getVersion(transport).pipe(
      catchError((e) => {
        if (e instanceof TransportStatusError) {
          // @ts-expect-error typescript not checking agains the instanceof
          if (e.statusCode === 0x6d06) {
            throw new DeviceNotOnboarded();
          }
        }
        throw e;
      }),
      switchMap((value) => {
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

        return of({
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
        });
      })
    )
  );
}
