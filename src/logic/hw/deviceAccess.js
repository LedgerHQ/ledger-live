// @flow

import { Observable, from, throwError, defer, timer } from "rxjs";
import { retryWhen, mergeMap } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import {
  WrongDeviceForAccount,
  CantOpenDevice,
  UpdateYourApp,
} from "@ledgerhq/live-common/lib/errors";
import { BluetoothRequired } from "../../errors";
import { open } from ".";

const transportCleanup = (transport: Transport<*>) => <T>(
  observable: Observable<T>,
): Observable<T> =>
  Observable.create(o => {
    let done = false;
    const sub = observable.subscribe({
      next: e => o.next(e),
      complete: () => {
        done = true;
        transport
          .close()
          .catch(() => {})
          .then(() => o.complete());
      },
      error: e => {
        done = true;
        transport
          .close()
          .catch(() => {})
          .then(() => o.error(e));
      },
    });
    return () => {
      sub.unsubscribe();
      if (!done) transport.close();
    };
  });

export const withDevice = (deviceId: string) => <T>(
  job: (t: Transport<*>) => Observable<T>,
): Observable<T> =>
  defer(() =>
    from(
      open(deviceId).catch(e => {
        if (e.name === "BluetoothRequired") throw e;
        throw new CantOpenDevice(e.message);
      }),
    ),
  ).pipe(
    mergeMap(transport => job(transport).pipe(transportCleanup(transport))),
  );

export const genericCanRetryOnError = (err: ?Error) => {
  if (err instanceof WrongDeviceForAccount) return false;
  if (err instanceof CantOpenDevice) return false;
  if (err instanceof BluetoothRequired) return false;
  if (err instanceof UpdateYourApp) return false;
  return true;
};

export const retryWhileErrors = (acceptError: Error => boolean) => (
  attempts: Observable<any>,
): Observable<any> =>
  attempts.pipe(
    mergeMap(error => {
      if (!acceptError(error)) {
        return throwError(error);
      }
      return timer(200);
    }),
  );

export const withDevicePolling = (deviceId: string) => <T>(
  job: (Transport<*>) => Observable<T>,
  acceptError: Error => boolean = genericCanRetryOnError,
) => withDevice(deviceId)(job).pipe(retryWhen(retryWhileErrors(acceptError)));
