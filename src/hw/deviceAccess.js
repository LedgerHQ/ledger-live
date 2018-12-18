// @flow

import { Observable, from, throwError, defer, timer } from "rxjs";
import { retryWhen, mergeMap, catchError } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import {
  WrongDeviceForAccount,
  CantOpenDevice,
  UpdateYourApp,
  BluetoothRequired
} from "../errors";
import { open } from ".";

export type AccessHook = () => () => void;

const accessHooks = [];
let errorRemapping = e => throwError(e);

export const addAccessHook = (accessHook: AccessHook) => {
  accessHooks.push(accessHook);
};

export const setErrorRemapping = (f: Error => Observable<*>) => {
  errorRemapping = f;
};

const transportFinally = (
  transport: Transport<*>,
  cleanups: Array<() => void>
) => <T>(observable: Observable<T>): Observable<T> =>
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
      cleanups.forEach(c => c());
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

const deviceQueues = {};

export const withDevice = (deviceId: string) => <T>(
  job: (t: Transport<*>) => Observable<T>
): Observable<T> =>
  defer(() => {
    // we get the current exec queue related to deviceId
    const deviceQueue = deviceQueues[deviceId] || Promise.resolve();

    // when we'll finish all the current job, we'll call finish
    let finish;
    // this new promise is the next exec queue
    deviceQueues[deviceId] = new Promise(resolve => {
      finish = resolve;
    });

    return from(
      // for any new job, we'll now wait the exec queue to be available
      deviceQueue
        .then(() => open(deviceId)) // open the transport
        .then(async transport => {
          if (needsCleanup[identifyTransport(transport)]) {
            delete needsCleanup[identifyTransport(transport)];
            await transport.send(0, 0, 0, 0).catch(() => {});
          }
          return transport;
        })
        .catch(e => {
          finish();
          if (e instanceof BluetoothRequired) throw e;
          throw new CantOpenDevice(e.message);
        })
    ).pipe(
      mergeMap(transport => {
        const cleanups = accessHooks.map(hook => hook());
        return job(transport).pipe(
          catchError(errorRemapping),
          // close the transport and clean up everything
          transportFinally(transport, [...cleanups, finish])
        );
      })
    );
  });

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
