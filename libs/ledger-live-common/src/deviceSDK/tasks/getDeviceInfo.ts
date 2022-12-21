import { DeviceOnDashboardExpected, LockedDeviceError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { DeviceId, DeviceInfo } from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";
import { getAppAndVersion } from "../commands/getAppAndVersion";

import isDevFirmware from "../../hw/isDevFirmware";
import { isDashboardName } from "../../hw/isDashboardName";
import { retryWhileErrors, withDevice } from "../../hw/deviceAccess";
import { PROVIDERS } from "../../manager/provider";
import { Observable } from "rxjs";
import { map, filter, switchMap, timeout, retryWhen } from "rxjs/operators";

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

// TODO: put it somewhere else: in the type lib
export type GeneralTaskEvent = { type: "error"; error: Error };

export type GetDeviceInfoTaskArgs = { deviceId: DeviceId };

// TODO: check if there's a way to be more specific than that
// It shoould be: DeviceOnDashboardExpected
export type GetDeviceInfoTaskError = Error;

export type GetDeviceInfoTaskEvent =
  | { type: "data"; deviceInfo: DeviceInfo }
  | { type: "taskError"; error: GetDeviceInfoTaskError }
  | GeneralTaskEvent;

const NO_RESPONSE_TIMEOUT_MS = 30000;

function wrappedGetDeviceInfoTask({ deviceId }) {
  /**
   * Timeouts that were not kept for now (and are probably not necessary):
   * - initT: if a first event is not sent before 5sec, fails
   * - disconnectT: a task specific timeout, used when opening an app in a task for ex
   *
   * We need something that retries the task in some cases, e.g. device locked
   *
   * Timeouts that are kept:
   * - DEVICE_POLLING_TIMEOUT -> NO_RESPONSE_TIMEOUT_MS
   *
   * NOT the case: We listen to "unresponsive" event from Transport and map this event to LockedDeviceError
   * inside the commands that needs it.
   *
   * At the Transport level: an exchange public method that would take a flag: throwOnUnresponsive which
   * throws on unresponsive.
   * We opt out of listening to "unresponsive" event from Transport in commands that needs to last longer
   */
  return getDeviceInfoTask({ deviceId }).pipe(
    timeout(NO_RESPONSE_TIMEOUT_MS),
    retryWhen(
      retryWhileErrors((error) => {
        if (error instanceof LockedDeviceError) {
          return true;
        }

        return false;
      })
    )
  );
}

// typeof lala = Error
// Implementation with new Observable: easier to read ?
// BUT: does not work currently because 2nd subscribe does not wait for 1st subscribe to complete
// Fix: subscribe to 1st, and on complete start the 2nd command -> but indentation hell
export function getDeviceInfoTask({
  deviceId,
}: GetDeviceInfoTaskArgs): Observable<GetDeviceInfoTaskEvent> {
  // Or the opposite: new Observable then withDevice ?

  // To avoid having another process communicating to the device while we are waiting for a http call response
  // and create issue once we want to communicate with the device again, keeping the withDevice forbids this to happen
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
      error: (error) => subscriber.next({ type: "error", error }),
      complete: () => subscriber.complete(),
    });
  });

  // return new Observable((o) => {
  //   withDevice(deviceId)((transport) => {
  //     getAppAndVersion(transport)
  //       .pipe(
  //         switchMap(({ name }) => {
  //           return isDashboardName(name);
  //         })
  //       )
  //       .subscribe({
  //         next: (probablyOnDashboard) => {
  //           if (!probablyOnDashboard) {
  //             o.error(new DeviceOnDashboardExpected());
  //           }
  //         },
  //         error: (e) => {
  //           console.log(`🚨 1st obs error: ${JSON.stringify(e)}`);
  //           o.error(e);
  //         },
  //         complete: () => {
  //           getVersion(transport)
  //             .pipe(
  //               switchMap((value) => {
  //                 const {
  //                   isBootloader,
  //                   rawVersion,
  //                   targetId,
  //                   seVersion,
  //                   seTargetId,
  //                   mcuBlVersion,
  //                   mcuVersion,
  //                   mcuTargetId,
  //                   flags,
  //                   bootloaderVersion,
  //                   hardwareVersion,
  //                   languageId,
  //                 } = value;

  //                 const isOSU = rawVersion.includes("-osu");
  //                 const version = rawVersion.replace("-osu", "");
  //                 const m = rawVersion.match(
  //                   /([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/
  //                 );
  //                 const [, majMin, , , postDash] = m || [];
  //                 const providerName = PROVIDERS[postDash] ? postDash : null;
  //                 const flag = flags.length > 0 ? flags[0] : 0;
  //                 const managerAllowed = !!(flag & ManagerAllowedFlag);
  //                 const pinValidated = !!(flag & PinValidatedFlag);

  //                 let isRecoveryMode = false;
  //                 let onboarded = true;
  //                 if (flags.length === 4) {
  //                   // Nb Since LNS+ unseeded devices are visible + extra flags
  //                   isRecoveryMode = !!(flags[0] & 0x01);
  //                   onboarded = !!(flags[0] & 0x04);
  //                 }

  //                 log(
  //                   "hw",
  //                   "deviceInfo: se@" +
  //                     version +
  //                     " mcu@" +
  //                     mcuVersion +
  //                     (isOSU ? " (osu)" : isBootloader ? " (bootloader)" : "")
  //                 );

  //                 const hasDevFirmware = isDevFirmware(seVersion);

  //                 return of({
  //                   version,
  //                   mcuVersion,
  //                   seVersion,
  //                   mcuBlVersion,
  //                   majMin,
  //                   providerName: providerName || null,
  //                   targetId,
  //                   hasDevFirmware,
  //                   seTargetId,
  //                   mcuTargetId,
  //                   isOSU,
  //                   isBootloader,
  //                   isRecoveryMode,
  //                   managerAllowed,
  //                   pinValidated,
  //                   onboarded,
  //                   bootloaderVersion,
  //                   hardwareVersion,
  //                   languageId,
  //                 });
  //               })
  //             )
  //             .subscribe({
  //               next: (value) => {
  //                 o.next(value);
  //               },
  //               error: (e) => {
  //                 // TODO: don't know if should handle it here
  //                 if (e instanceof TransportStatusError) {
  //                   // @ts-expect-error typescript not checking agains the instanceof
  //                   if (e.statusCode === 0x6d06) {
  //                     o.error(DeviceNotOnboarded());
  //                   }
  //                 }

  //                 console.log(`🚨 2st obs error: ${JSON.stringify(e)}`);
  //                 o.error(e);
  //               },
  //               complete: () => o.complete(),
  //             });
  //         },
  //       });
  //   });
  // });
}

// Implementation full pipe: harder to read ?
// Actually pipe does not wait to start () => getVersion(transport) ?!
// export function getDeviceInfo2({
//   deviceId,
// }: GetDeviceInfoTaskArgs): GetDeviceInfoTaskEvent {
//   return withDevice(deviceId)((transport) =>
//     // getAppAndVersion(transport).pipe(
//     //   switchMap(({ name }) => {
//     //     return of(isDashboardName(name));
//     //   }),
//     //   catchError((e) => {
//     //     if (e instanceof TransportStatusError) {
//     //       // @ts-expect-error typescript not checking agains the instanceof
//     //       if (e.statusCode === 0x6e00) {
//     //         return of(true);
//     //       }

//     //       // @ts-expect-error typescript not checking agains the instanceof
//     //       if (e.statusCode === 0x6d00) {
//     //         return of(false);
//     //       }
//     //     }

//     //     throw e;
//     //   }),
//     //   switchMap((probablyOnDashboard) => {
//     //     if (!probablyOnDashboard) {
//     //       throw new DeviceOnDashboardExpected();
//     //     }

//     //     return of(true);
//     //   }),
//     // () => getVersion(transport),
//     // getVersion(transport).pipe(
//     //   catchError((e) => {
//     //     if (e instanceof TransportStatusError) {
//     //       // @ts-expect-error typescript not checking agains the instanceof
//     //       if (e.statusCode === 0x6d06) {
//     //         throw new DeviceNotOnboarded();
//     //       }
//     //     }
//     //     throw e;
//     //   }),
//     //   switchMap((value) => {
//     //     const {
//     //       isBootloader,
//     //       rawVersion,
//     //       targetId,
//     //       seVersion,
//     //       seTargetId,
//     //       mcuBlVersion,
//     //       mcuVersion,
//     //       mcuTargetId,
//     //       flags,
//     //       bootloaderVersion,
//     //       hardwareVersion,
//     //       languageId,
//     //     } = value;
//     //     const isOSU = rawVersion.includes("-osu");
//     //     const version = rawVersion.replace("-osu", "");
//     //     const m = rawVersion.match(/([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/);
//     //     const [, majMin, , , postDash] = m || [];
//     //     const providerName = PROVIDERS[postDash] ? postDash : null;
//     //     const flag = flags.length > 0 ? flags[0] : 0;
//     //     const managerAllowed = !!(flag & ManagerAllowedFlag);
//     //     const pinValidated = !!(flag & PinValidatedFlag);

//     //     let isRecoveryMode = false;
//     //     let onboarded = true;
//     //     if (flags.length === 4) {
//     //       // Nb Since LNS+ unseeded devices are visible + extra flags
//     //       isRecoveryMode = !!(flags[0] & 0x01);
//     //       onboarded = !!(flags[0] & 0x04);
//     //     }

//     //     log(
//     //       "hw",
//     //       "deviceInfo: se@" +
//     //         version +
//     //         " mcu@" +
//     //         mcuVersion +
//     //         (isOSU ? " (osu)" : isBootloader ? " (bootloader)" : "")
//     //     );

//     //     const hasDevFirmware = isDevFirmware(seVersion);

//     //     return of({
//     //       version,
//     //       mcuVersion,
//     //       seVersion,
//     //       mcuBlVersion,
//     //       majMin,
//     //       providerName: providerName || null,
//     //       targetId,
//     //       hasDevFirmware,
//     //       seTargetId,
//     //       mcuTargetId,
//     //       isOSU,
//     //       isBootloader,
//     //       isRecoveryMode,
//     //       managerAllowed,
//     //       pinValidated,
//     //       onboarded,
//     //       bootloaderVersion,
//     //       hardwareVersion,
//     //       languageId,
//     //     });
//     //   })
//     // )
//   );
// }
