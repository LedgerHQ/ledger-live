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
  PeerRemovedPairing,
  PairingFailed,
} from "@ledgerhq/errors";
import { LocalTracer, TraceContext, trace } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import { open, close, setAllowAutoDisconnect } from ".";

const LOG_TYPE = "hw";

const initialErrorRemapping = (error: unknown, context?: TraceContext) => {
  let mappedError = error;

  if (error && error instanceof TransportStatusError) {
    // @ts-expect-error TS only inferring Error and not TransportStatusError
    if (error.statusCode === 0x6faa) {
      mappedError = new DeviceHalted(error.message);
      // @ts-expect-error TransportStatusError
    } else if (error.statusCode === 0x6b00) {
      mappedError = new FirmwareOrAppUpdateRequired(error.message);
    }
  }

  trace({
    type: LOG_TYPE,
    message: "Initial error remapping",
    data: { error, mappedError },
    context,
  });
  return throwError(() => mappedError);
};

let errorRemapping = e => throwError(() => e);

export const setErrorRemapping = (f: (arg0: Error) => Observable<never>): void => {
  errorRemapping = f;
};
const never = new Promise(() => {});

/**
 * Wrapper to pipe a "cleanup" function at then end of an Observable flow.
 *
 * The `finalize` is only called once if there is an error and a complete
 * (but normally an error event completes automatically the Observable pipes. Is it needed ?)
 */
function transportFinally(cleanup: () => Promise<void>) {
  return <T>(observable: Observable<T>): Observable<T> => {
    return new Observable(o => {
      let done = false;

      const finalize = () => {
        if (done) return never;
        done = true;
        return cleanup();
      };

      const sub = observable.subscribe({
        next: e => o.next(e),
        complete: () => {
          finalize().then(() => o.complete());
        },
        error: e => {
          finalize().then(() => o.error(e));
        },
      });
      return () => {
        sub.unsubscribe();
        finalize();
      };
    });
  };
}

const identifyTransport = t => (typeof t.id === "string" ? t.id : "");

const needsCleanup = {};
// When a series of APDUs are interrupted, this is called
// so we don't forget to cleanup on the next withDevice
export const cancelDeviceAction = (transport: Transport): void => {
  const transportId = identifyTransport(transport);
  trace({
    type: LOG_TYPE,
    message: "Cancelling device action",
    data: { transportId },
  });

  needsCleanup[transportId] = true;
};

// The devicesQueues object only stores, for each device, the latest void promise that will resolve when the device is ready to be opened again.
// They are scheduled to resolve whenever the job associated to the device is finished.
// When calling withDevice several times, the new promise will be chained to the "then" of the previous promise:
// open(device) -> execute job -> clean connection -> resolve promise -> next promise can start: open(device) -> etc.
// So a queue is indeed created for each device, by creating a chain of promises, but only the end of the queue is stored for each device.
const deviceQueues: { [deviceId: string]: { job: Promise<void>; id: number } } = {};

// To be able to differentiate withDevice calls in our logs
let jobId = 0;

/**
 * Provides a Transport instance to a given job
 *
 * @param deviceId
 * @param options contains optional configuration
 *   - openTimeoutMs: TODO: to keep, will be used in a separate PR
 */
export const withDevice =
  (deviceId: string, options?: { openTimeoutMs?: number }) =>
  <T>(job: (t: Transport) => Observable<T>): Observable<T> =>
    new Observable(o => {
      jobId++;
      const tracer = new LocalTracer(LOG_TYPE, { jobId: jobId, origin: "hw:withDevice" });
      tracer.trace(`New job for device: ${deviceId || "USB"}`);

      let unsubscribed;
      let sub;
      const deviceQueue = deviceQueues[deviceId] || { job: Promise.resolve(), id: -1 };

      // To call to cleanup the current transport
      const finalize = (transport: Transport, cleanups: Array<() => void>) => {
        tracer.trace("Closing and cleaning transport");

        setAllowAutoDisconnect(transport, deviceId, true);
        return close(transport, deviceId)
          .catch(() => {})
          .then(() => {
            cleanups.forEach(c => c());
          });
      };

      // When we'll finish all the current job, we'll call finish
      let resolveQueuedJob;

      // Queue of linked Promises that wait after each other
      // Blocking any future job on this device
      deviceQueues[deviceId] = {
        job: new Promise(resolve => {
          resolveQueuedJob = resolve;
        }),
        id: jobId,
      };

      tracer.trace("Waiting for the previous job in the queue to complete", {
        previousJobId: deviceQueue.id,
      });
      // For any new job, we'll now wait the exec queue to be available
      deviceQueue.job
        .then(() => {
          tracer.trace("Previous queued job resolved, now trying to get a Transport instance", {
            previousJobId: deviceQueue.id,
            currentJobId: jobId,
          });
          return open(deviceId, options?.openTimeoutMs, tracer.getContext());
        }) // open the transport
        .then(async transport => {
          tracer.trace("Got a Transport instance from open");

          if (unsubscribed) {
            tracer.trace("Unsubscribed (1) while processing job");
            // It was unsubscribed prematurely
            return finalize(transport, [resolveQueuedJob]);
          }
          setAllowAutoDisconnect(transport, deviceId, false);

          if (needsCleanup[identifyTransport(transport)]) {
            delete needsCleanup[identifyTransport(transport)];
            await transport.send(0, 0, 0, 0).catch(() => {});
          }

          return transport;
        })
        // This catch is here only for errors that might happen at open or at clean up of the transport before doing the job
        .catch(e => {
          tracer.trace("Error while opening Transport: ", { e });
          resolveQueuedJob();
          if (e instanceof BluetoothRequired) throw e;
          if (e instanceof TransportWebUSBGestureRequired) throw e;
          if (e instanceof TransportInterfaceNotAvailable) throw e;
          if (e instanceof PeerRemovedPairing) throw e;
          if (e instanceof PairingFailed) throw e;
          throw new CantOpenDevice(e.message);
        })
        // Executes the job
        .then(transport => {
          tracer.trace("Executing job", { hasTransport: !!transport, unsubscribed });
          if (!transport) return;

          // It was unsubscribed prematurely
          if (unsubscribed) {
            tracer.trace("Unsubscribed (2) while processing job");
            return finalize(transport, [resolveQueuedJob]);
          }

          sub = job(transport)
            .pipe(
              catchError(error => initialErrorRemapping(error, tracer.getContext())),
              catchError(errorRemapping),
              transportFinally(() => {
                // Closes the transport and cleans up everything
                return finalize(transport, [resolveQueuedJob]);
              }),
            )
            .subscribe({
              next: event => {
                // This kind of log should be a "debug" level for ex
                // tracer.trace("Job next", { event });
                o.next(event);
              },
              error: error => {
                tracer.trace("Job error", { error });
                o.error(error);
              },
              complete: () => {
                o.complete();
              },
            });
        })
        .catch(error => {
          tracer.trace("Caught error on job execution step", { error });
          o.error(error);
        });

      // Returns function to unsubscribe from the job if we don't need it anymore.
      // This will prevent us from executing the job unnecessarily later on
      return () => {
        tracer.trace(`Unsubscribing withDevice flow. Ongoing job to unsubscribe from ? ${!!sub}`);
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
      mergeMap(error => {
        if (!acceptError(error)) {
          return throwError(() => error);
        }

        return timer(getEnv("WITH_DEVICE_POLLING_DELAY"));
      }),
    );

export const withDevicePolling =
  (deviceId: string) =>
  <T>(
    job: (arg0: Transport) => Observable<T>,
    acceptError: (arg0: Error) => boolean = genericCanRetryOnError,
  ): Observable<T> =>
    withDevice(deviceId)(job).pipe(retryWhen(retryWhileErrors(acceptError)));
