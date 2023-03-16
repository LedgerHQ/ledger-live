import { Observable, throwError, timer } from "rxjs";
import { retryWhen, mergeMap, catchError } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
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
import { log } from "@ledgerhq/logs";
import { getEnv } from "../env";
import { open, close, setAllowAutoDisconnect } from ".";

const initialErrorRemapping = (error) =>
  throwError(
    error &&
      error instanceof TransportStatusError &&
      // @ts-expect-error typescript not checking agains the instanceof
      error.statusCode === 0x6faa
      ? new DeviceHalted(error.message)
      : error.statusCode === 0x6b00
      ? new FirmwareOrAppUpdateRequired(error.message)
      : error
  );

let errorRemapping = (e) => throwError(e);

export const setErrorRemapping = (
  f: (arg0: Error) => Observable<never>
): void => {
  errorRemapping = f;
};
const never = new Promise(() => {});

const transportFinally =
  (cleanup: () => Promise<void>) =>
  <T>(observable: Observable<T>): Observable<T> =>
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
// When a series of APDUs are interrupted, this is called
// so we don't forget to cleanup on the next withDevice
export const cancelDeviceAction = (transport: Transport): void => {
  needsCleanup[identifyTransport(transport)] = true;
};

// The devicesQueues object only stores, for each device, the latest void promise that will resolve when the device is ready to be opened again.
// They are scheduled to resolve whenever the job associated to the device is finished.
// When calling withDevice several times, the new promise will be chained to the "then" of the previous promise:
// open(device) -> execute job -> clean connection -> resolve promise -> next promise can start: open(device) -> etc.
// So a queue is indeed created for each device, by creating a chain of promises, but only the end of the queue is stored for each device.
const deviceQueues: { [deviceId: string]: Promise<void> } = {};

// To be able to differentiate withDevice calls in our logs
let withDeviceNonce = 0;

export const withDevice =
  (deviceId: string) =>
  <T>(job: (t: Transport) => Observable<T>): Observable<T> =>
    new Observable((o) => {
      const nonce = withDeviceNonce++;
      log("withDevice", `${nonce}: New job: deviceId=${deviceId || "USB"}`);

      let unsubscribed;
      let sub;
      const deviceQueue = deviceQueues[deviceId] || Promise.resolve();

      const finalize = (transport, cleanups) => {
        setAllowAutoDisconnect(transport, deviceId, true);
        return close(transport, deviceId)
          .catch(() => {})
          .then(() => {
            cleanups.forEach((c) => c());
          });
      };

      // When we'll finish all the current job, we'll call finish
      let resolveQueuedDevice;

      // This new promise is the next exec queue
      deviceQueues[deviceId] = new Promise((resolve) => {
        resolveQueuedDevice = resolve;
      });

      log("withDevice", `${nonce}: Waiting for queue to complete`, {
        deviceQueue,
      });
      // For any new job, we'll now wait the exec queue to be available
      deviceQueue
        .then(() => open(deviceId)) // open the transport
        .then(async (transport) => {
          log("withDevice", `${nonce}: got a transport`);

          if (unsubscribed) {
            log("withDevice", `${nonce}: but we're unsubscribed`);
            // It was unsubscribed prematurely
            return finalize(transport, [resolveQueuedDevice]);
          }
          setAllowAutoDisconnect(transport, deviceId, false);

          if (needsCleanup[identifyTransport(transport)]) {
            delete needsCleanup[identifyTransport(transport)];
            await transport.send(0, 0, 0, 0).catch(() => {});
          }

          return transport;
        })
        // This catch is here only for errors that might happen at open or at clean up of the transport before doing the job
        .catch((e) => {
          resolveQueuedDevice();
          if (e instanceof BluetoothRequired) throw e;
          if (e instanceof TransportWebUSBGestureRequired) throw e;
          if (e instanceof TransportInterfaceNotAvailable) throw e;
          throw new CantOpenDevice(e.message);
        })
        // Executes the job
        .then((transport) => {
          if (!transport) return;

          if (unsubscribed) {
            // It was unsubscribed prematurely
            return finalize(transport, [resolveQueuedDevice]);
          }

          log("withDevice", `${nonce}: Starting job`);
          sub = job(transport)
            .pipe(
              catchError(initialErrorRemapping),
              catchError(errorRemapping), // close the transport and clean up everything
              transportFinally(() => {
                log("withDevice", `${nonce}: job fully completed`);
                return finalize(transport, [resolveQueuedDevice]);
              })
            )
            .subscribe(o);
        })
        .catch((error) => o.error(error));

      // Returns function to unsubscribe from the job if we don't need it anymore.
      // This will prevent us from executing the job unnecessarily later on
      return () => {
        log("withDevice", `${nonce}: Unsubscribing job: ${!!sub}`);
        unsubscribed = true;
        if (sub) sub.unsubscribe();
      };
    });

export const genericCanRetryOnError = (err: unknown): boolean => {
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

export const retryWhileErrors =
  (acceptError: (arg0: Error) => boolean) =>
  (attempts: Observable<any>): Observable<any> =>
    attempts.pipe(
      mergeMap((error) => {
        if (!acceptError(error)) {
          return throwError(error);
        }

        return timer(getEnv("WITH_DEVICE_POLLING_DELAY"));
      })
    );

export const withDevicePolling =
  (deviceId: string) =>
  <T>(
    job: (arg0: Transport) => Observable<T>,
    acceptError: (arg0: Error) => boolean = genericCanRetryOnError
  ): Observable<T> =>
    withDevice(deviceId)(job).pipe(retryWhen(retryWhileErrors(acceptError)));
