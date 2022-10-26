import { Observable, concat, from, of, throwError } from "rxjs";
import { concatMap, catchError, delay } from "rxjs/operators";
import {
  TransportStatusError,
  DeviceOnDashboardExpected,
  StatusCodes,
} from "@ledgerhq/errors";
import { DeviceInfo } from "@ledgerhq/types-live";
import type { ListAppsEvent } from "../apps";
import { listApps } from "../apps/hw";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import { DeviceNotOnboarded } from "../errors";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";
import { LockedDeviceEvent } from "./actions/types";

export type Input = {
  devicePath: string;
  managerRequest:
    | {
        autoQuitAppDisabled?: boolean;
      }
    | null
    | undefined;
};

export type ConnectManagerEvent =
  | AttemptToQuitAppEvent
  | {
      type: "osu";
      deviceInfo: DeviceInfo;
    }
  | {
      type: "bootloader";
      deviceInfo: DeviceInfo;
    }
  | {
      type: "listingApps";
      deviceInfo: DeviceInfo;
    }
  | ListAppsEvent
  | LockedDeviceEvent;

const cmd = ({
  devicePath,
  managerRequest,
}: Input): Observable<ConnectManagerEvent> =>
  withDevice(devicePath)(
    (transport) =>
      new Observable((o) => {
        const timeoutSub = of({
          type: "unresponsiveDevice",
        } as ConnectManagerEvent)
          .pipe(delay(1000))
          .subscribe((e) => o.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            concatMap((deviceInfo) => {
              timeoutSub.unsubscribe();

              if (!deviceInfo.onboarded && !deviceInfo.isRecoveryMode) {
                throw new DeviceNotOnboarded();
              }

              if (deviceInfo.isBootloader) {
                return of({
                  type: "bootloader",
                  deviceInfo,
                } as ConnectManagerEvent);
              }

              if (deviceInfo.isOSU) {
                return of({
                  type: "osu",
                  deviceInfo,
                } as ConnectManagerEvent);
              }

              return concat(
                of({
                  type: "listingApps",
                  deviceInfo,
                } as ConnectManagerEvent),
                listApps(transport, deviceInfo)
              );
            }),
            catchError((e: unknown) => {
              if (
                e &&
                e instanceof TransportStatusError &&
                // @ts-expect-error typescript not checking agains the instanceof
                e.statusCode === StatusCodes.LOCKED_DEVICE
              ) {
                return of({
                  type: "lockedDevice",
                } as ConnectManagerEvent);
              } else if (
                e instanceof DeviceOnDashboardExpected ||
                (e &&
                  e instanceof TransportStatusError &&
                  [
                    StatusCodes.CLA_NOT_SUPPORTED,
                    StatusCodes.INS_NOT_SUPPORTED,
                    0x6e01, // No StatusCodes definition
                    0x6d01, // No StatusCodes definition
                    0x6d02, // No StatusCodes definition
                  ].includes(
                    // @ts-expect-error typescript not checking agains the instanceof
                    e.statusCode
                  ))
              ) {
                return from(getAppAndVersion(transport)).pipe(
                  concatMap((appAndVersion) => {
                    return !managerRequest?.autoQuitAppDisabled &&
                      !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of({
                          type: "appDetected",
                        } as ConnectManagerEvent);
                  })
                );
              }

              return throwError(e);
            })
          )
          .subscribe(o);

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      })
  );

export default cmd;
