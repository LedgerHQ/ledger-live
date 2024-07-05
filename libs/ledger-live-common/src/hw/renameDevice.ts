import { concat, defer, from, Observable, of, throwError } from "rxjs";
import { catchError, concatMap } from "rxjs/operators";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { withDevice } from "./deviceAccess";
import editDeviceName from "./editDeviceName";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import quitApp from "./quitApp";

export type RenameDeviceEvent =
  | { type: "quit-app" }
  | { type: "on-dashboard" }
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "permission-requested";
    }
  | {
      type: "device-renamed";
      name: string;
    }
  | {
      type: "waiting-device";
    }
  | {
      type: "disconnected";
      expected?: boolean;
    }
  | {
      type: "error";
      error: Error;
    };

export type RenameDeviceRequest = { name: string };
export type Input = {
  deviceId: string;
  request: RenameDeviceRequest;
};

export default function renameDevice({ deviceId, request }: Input): Observable<RenameDeviceEvent> {
  const { name } = request;

  return withDevice(deviceId)(transport => {
    /**
     * We create a new observable that will be returned to the caller
     * that will be used to subscribe to the RenameDeviceEvent events
     */
    return new Observable<RenameDeviceEvent>(o => {
      /**
       * Inner function that will be called recursively until the device is on the dashboard
       * and we can send the renameDevice command to the device
       */
      const innerSub: Observable<RenameDeviceEvent> =
        /**
         * defer takes a factory function that returns an observable, thus
         * calling the function again will not use the same output as the previous call
         */
        defer(() => from(getAppAndVersion(transport))).pipe(
          /**
           * we get the appAndVersion
           */
          concatMap(appAndVersion => {
            if (isDashboardName(appAndVersion.name)) {
              /**
               * If we are on the dashboard, we can rename the device
               */
              return concat(
                of<RenameDeviceEvent>({ type: "permission-requested" }),
                from(editDeviceName(transport, name)).pipe(
                  concatMap(() => of<RenameDeviceEvent>({ type: "device-renamed", name })),
                ),
              );
            }

            /**
             * If we are not on dashboard, we quit the app
             * and send an exepected disconnected event while withDevice will retry to run the innerSub
             */
            return concat(
              of<RenameDeviceEvent>({ type: "quit-app" }),
              from(quitApp(transport)).pipe(
                concatMap(() => of<RenameDeviceEvent>({ type: "disconnected", expected: true })),
              ),
            );
          }),
        );

      const sub = innerSub
        .pipe(
          catchError((error: Error) => {
            /**
             * If the error is that the device is not on the dashboard, we retry the innerSub
             */
            if (error.message === "not on dashboard" || error instanceof DisconnectedDevice) {
              return innerSub;
            }

            return throwError(() => error);
          }),
        )
        .subscribe(o);

      return () => {
        /**
         * When the observable is unsubscribed, we unsubscribe the innerSub
         */
        sub.unsubscribe();
      };
    });
  }).pipe(
    catchError((error: Error) => {
      /**
       *
       * If the error is that the device is not on the dashboard or Disconnected, we return a waiting-device event
       * which is not used in the renameDevice reducer, just to trick the UI not to flicker.
       * We do have a global timeout so that we are not in a infinite loop
       *
       */
      if (error.message === "not on dashboard" || error instanceof DisconnectedDevice) {
        return of<RenameDeviceEvent>({
          type: "disconnected",
          expected: true,
        });
      }

      return throwError(() => error);
    }),
  );
}
