// @flow

import { Observable, from, throwError, defer, timer } from "rxjs";
import { retryWhen, mergeMap } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import {
  WrongDeviceForAccount,
  CantOpenDevice,
  UpdateYourApp,
  BluetoothRequired
} from "../errors";
import { open } from ".";

const transportFinally = (transport: Transport<*>) => <T>(
  observable: Observable<T>
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
      }
    });
    return () => {
      sub.unsubscribe();
      if (!done) transport.close();
    };
  });

// $FlowFixMe
const identifyTransport = t => (typeof t.id === "string" ? t.id : "");

const needsCleanup = {};

// when a series of APDUs are interrupted, this is called
// so we don't forget to cleanup on the next withDevice
export const cancelDeviceAction = (transport: Transport<*>) => {
  needsCleanup[identifyTransport(transport)] = true;
};

export const withDevice = (deviceId: string) => <T>(
  job: (t: Transport<*>) => Observable<T>
): Observable<T> =>
  defer(() =>
    from(
      open(deviceId)
        .then(async transport => {
          if (needsCleanup[identifyTransport(transport)]) {
            delete needsCleanup[identifyTransport(transport)];
            await transport.send(0, 0, 0, 0).catch(() => {});
          }
          return transport;
        })
        .catch(e => {
          if (e instanceof BluetoothRequired) throw e;
          throw new CantOpenDevice(e.message);
        })
    )
  ).pipe(
    mergeMap(transport => job(transport).pipe(transportFinally(transport)))
  );

export const genericCanRetryOnError = (err: ?Error) => {
  if (err instanceof WrongDeviceForAccount) return false;
  if (err instanceof CantOpenDevice) return false;
  if (err instanceof BluetoothRequired) return false;
  if (err instanceof UpdateYourApp) return false;
  return true;
};

export const retryWhileErrors = (acceptError: Error => boolean) => (
  attempts: Observable<any>
): Observable<any> =>
  attempts.pipe(
    mergeMap(error => {
      if (!acceptError(error)) {
        return throwError(error);
      }
      return timer(200);
    })
  );

export const withDevicePolling = (deviceId: string) => <T>(
  job: (Transport<*>) => Observable<T>,
  acceptError: Error => boolean = genericCanRetryOnError
) => withDevice(deviceId)(job).pipe(retryWhen(retryWhileErrors(acceptError)));
