import { Observable, concat, from, of, throwError } from "rxjs";
import { concatMap, catchError, delay } from "rxjs/operators";
import {
  TransportStatusError,
  DeviceOnDashboardExpected,
} from "@ledgerhq/errors";
import type { ListAppsEvent } from "../apps";
import { listApps } from "../apps/hw";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import { DeviceNotOnboarded } from "../errors";

import { DeviceInfo } from "@ledgerhq/types-live";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";

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
  | ListAppsEvent;

const cmd = ({
  devicePath,
  managerRequest,
}: Input): Observable<ConnectManagerEvent> =>
  withDevice(devicePath)((transport) =>
    Observable.create((o) => {
      const timeoutSub = of({
        type: "unresponsiveDevice",
      })
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
              });
            }

            if (deviceInfo.isOSU) {
              return of({
                type: "osu",
                deviceInfo,
              });
            }

            return concat(
              of({
                type: "listingApps",
                deviceInfo,
              }),
              listApps(transport, deviceInfo)
            );
          }),
          catchError((e: unknown) => {
            if (
              e instanceof DeviceOnDashboardExpected ||
              (e &&
                e instanceof TransportStatusError &&
                // @ts-expect-error typescript not checking agains the instanceof
                [0x6e00, 0x6d00, 0x6e01, 0x6d01, 0x6d02].includes(e.statusCode))
            ) {
              return from(getAppAndVersion(transport)).pipe(
                concatMap((appAndVersion) => {
                  return !managerRequest?.autoQuitAppDisabled &&
                    !isDashboardName(appAndVersion.name)
                    ? attemptToQuitApp(transport, appAndVersion)
                    : of({
                        type: "appDetected",
                      });
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
