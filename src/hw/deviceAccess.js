// @flow

import { Observable, throwError, timer } from "rxjs";
import { retryWhen, mergeMap, catchError } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import {
  WrongDeviceForAccount,
  WrongAppForCurrency,
  CantOpenDevice,
  UpdateYourApp,
  BluetoothRequired,
  TransportWebUSBGestureRequired,
  TransportInterfaceNotAvailable,
  FirmwareOrAppUpdateRequired,
  TransportStatusError,
  DeviceHalted,
} from "@ledgerhq/errors";
import { getEnv } from "../env";
import { open, close } from ".";

export type AccessHook = () => () => void;

const initialErrorRemapping = (error) =>
  throwError(
    error &&
      error instanceof TransportStatusError &&
      error.statusCode === 0x6faa
      ? new DeviceHalted(error.message)
      : error.statusCode === 0x6b00
      ? new FirmwareOrAppUpdateRequired(error.message)
      : error
  );

const accessHooks = [];
let errorRemapping = (e) => throwError(e);

export const addAccessHook = (accessHook: AccessHook) => {
  accessHooks.push(accessHook);
};

export const setErrorRemapping = (f: (Error) => Observable<*>) => {
  errorRemapping = f;
};

const never = new Promise(() => {});

const transportFinally = (cleanup: () => Promise<void>) => <T>(
  observable: Observable<T>
): Observable<T> =>
  Observable.create((o) => {
    let done = false;
    const finalize = () => {
      if (done) return never;
      done = true;
      return cleanup();
    };
    const sub = observable.subscribe({
      next: (e) => o.next(e),
      complete: () => {
        finalize().then(() => o.complete());
      },
      error: (e) => {
        finalize().then(() => o.error(e));
      },
    });
    return () => {
      sub.unsubscribe();
      finalize();
    };
  });

const identifyTransport = (t) => (typeof t.id === "string" ? t.id : "");

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
  Observable.create((o) => {
    let unsubscribed;
    let sub;

    const deviceQueue = deviceQueues[deviceId] || Promise.resolve();

    const finalize = (transport, cleanups) =>
      close(transport, deviceId)
        .catch(() => {})
        .then(() => {
          cleanups.forEach((c) => c());
        });

    // when we'll finish all the current job, we'll call finish
    let finish;
    // this new promise is the next exec queue
    deviceQueues[deviceId] = new Promise((resolve) => {
      finish = resolve;
    });

    // for any new job, we'll now wait the exec queue to be available
    deviceQueue
      .then(() => open(deviceId)) // open the transport
      .then(async (transport) => {
        if (unsubscribed) {
          // it was unsubscribed prematurely
          return finalize(transport, [finish]);
        }

        if (needsCleanup[identifyTransport(transport)]) {
          delete needsCleanup[identifyTransport(transport)];
          await transport.send(0, 0, 0, 0).catch(() => {});
        }

        if (
          transport.requestConnectionPriority &&
          typeof transport.requestConnectionPriority === "function"
        ) {
          await transport.requestConnectionPriority("High");
        }

        return transport;
      })
      .catch((e) => {
        finish();
        if (e instanceof BluetoothRequired) throw e;
        if (e instanceof TransportWebUSBGestureRequired) throw e;
        if (e instanceof TransportInterfaceNotAvailable) throw e;
        throw new CantOpenDevice(e.message);
      })
      .then((transport) => {
        if (!transport) return;

        if (unsubscribed) {
          // it was unsubscribed prematurely
          return finalize(transport, [finish]);
        }

        const cleanups = accessHooks.map((hook) => hook());
        sub = job(transport)
          // $FlowFixMe
          .pipe(
            catchError(initialErrorRemapping),
            catchError(errorRemapping),
            // close the transport and clean up everything
            // $FlowFixMe
            transportFinally(() => finalize(transport, [...cleanups, finish]))
          )
          .subscribe(o);
      })
      .catch((error) => o.error(error));

    return () => {
      unsubscribed = true;
      if (sub) sub.unsubscribe();
    };
  });

export const genericCanRetryOnError = (err: ?Error) => {
  if (err instanceof WrongAppForCurrency) return false;
  if (err instanceof WrongDeviceForAccount) return false;
  if (err instanceof CantOpenDevice) return false;
  if (err instanceof BluetoothRequired) return false;
  if (err instanceof UpdateYourApp) return false;
  if (err instanceof FirmwareOrAppUpdateRequired) return false;
  if (err instanceof DeviceHalted) return false;
  if (err instanceof TransportWebUSBGestureRequired) return false;
  if (err instanceof TransportInterfaceNotAvailable) return false;
  return true;
};

export const retryWhileErrors = (acceptError: (Error) => boolean) => (
  attempts: Observable<any>
): Observable<any> =>
  attempts.pipe(
    mergeMap((error) => {
      if (!acceptError(error)) {
        return throwError(error);
      }
      return timer(getEnv("WITH_DEVICE_POLLING_DELAY"));
    })
  );

export const withDevicePolling = (deviceId: string) => <T>(
  job: (Transport<*>) => Observable<T>,
  acceptError: (Error) => boolean = genericCanRetryOnError
): Observable<T> =>
  // $FlowFixMe
  withDevice(deviceId)(job).pipe(
    // $FlowFixMe
    retryWhen(retryWhileErrors(acceptError))
  );
