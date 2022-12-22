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
// when a series of APDUs are interrupted, this is called
// so we don't forget to cleanup on the next withDevice
export const cancelDeviceAction = (transport: Transport): void => {
  needsCleanup[identifyTransport(transport)] = true;
};

// Gabriel's comment:
// this looks like a mutex access logic to prevent a same device from being open multiple times
// we have empty promises that get resolved when we're able to
// open the device with that id, I don't think we should be using promises at all for this kind of stuff
// we're only using it so we can call open(deviceId) when the previous connection has been clean
// but why don't we just store the "connection" open status and create an actual queue
const deviceQueues: { [deviceId: string]: Promise<void> } = {};

// Gabriel's hypothesis on how this works:
// the devicesQueues object only stores the latest promise for a device, and we schedule to resolve that whenever the job is finished
// the thing is, if we call withDevice several times, we'll be chaining the new promise to the "then" of the previous promise
// so we're indeed creating a queue, by creating a chain of promises, but we're only storing the end of the queue so we can chain the next promise
// we're never actually storing the full queue, but the chain of promises still exist in memory, and they will do what they are supposed to do in order
// that is open(device) -> execute job -> clean connection -> resolve promise -> next promise can start, so open(device) -> and so one...

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
          log("withDevice", `${nonce}: Starting job`);
          setAllowAutoDisconnect(transport, deviceId, false);
          if (unsubscribed) {
            // It was unsubscribed prematurely
            return finalize(transport, [resolveQueuedDevice]);
          }

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

          sub = job(transport) // $FlowFixMe
            .pipe(
              catchError(initialErrorRemapping),
              catchError(errorRemapping), // close the transport and clean up everything
              // $FlowFixMe
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
