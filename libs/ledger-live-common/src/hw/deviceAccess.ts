import { firstValueFrom, from, Observable, throwError, timer } from "rxjs";
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
import { open, close, OpenOptions } from ".";

const LOG_TYPE = "hw";

const initialErrorRemapping = (error: unknown, context?: TraceContext) => {
  let mappedError = error;

  if (error && error instanceof TransportStatusError) {
    if (error.statusCode === 0x6faa) {
      mappedError = new DeviceHalted(error.message);
    } else if (error.statusCode === 0x6b00) {
      mappedError = new FirmwareOrAppUpdateRequired(error.message);
    }
  }

  trace({
    type: LOG_TYPE,
    message: `Initial error remapping: ${error}`,
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

/**
 * Provides a Transport instance to a given job
 *
 * @param deviceId
 * @param options contains optional configuration
 *   - openTimeoutMs: optional timeout that limits in time the open attempt of the matching registered transport.
 *   - matchDeviceByName: optional name of the device to match.
 */
export const withDevice =
  (deviceId: string, options?: OpenOptions) =>
  <T>(job: (t: Transport) => Observable<T>): Observable<T> =>
    new Observable(o => {
      const tracer = new LocalTracer(LOG_TYPE, { deviceId, origin: "hw:withDevice" });
      tracer.trace(`New job for device: ${deviceId || "USB"}`);

      // To call to cleanup the current transport
      const finalize = async (transport: Transport) => {
        tracer.trace("Closing and cleaning transport", { function: "finalize" });

        try {
          await close(transport, deviceId);
        } catch (error) {
          tracer.trace(`An error occurred when closing transport (ignoring it): ${error}`, {
            error,
            function: "finalize",
          });
        }
      };

      let unsubscribed;
      let sub;

      // Open the transport
      open(deviceId, options, tracer.getContext())
        .then(async transport => {
          tracer.trace("Got a Transport instance from open");

          if (unsubscribed) {
            tracer.trace("Unsubscribed while opening transport");
            // It was unsubscribed prematurely
            return finalize(transport);
          }

          if (needsCleanup[identifyTransport(transport)]) {
            delete needsCleanup[identifyTransport(transport)];
            await transport.send(0, 0, 0, 0).catch(() => {});
          }

          return transport;
        })
        // This catch is here only for errors that might happen at open or at clean up of the transport before doing the job
        .catch(e => {
          tracer.trace(`Error while opening Transport: ${e}`, { error: e });
          if (e instanceof BluetoothRequired) throw e;
          if (e instanceof TransportWebUSBGestureRequired) throw e;
          if (e instanceof TransportInterfaceNotAvailable) throw e;
          if (e instanceof PeerRemovedPairing) throw e;
          if (e instanceof PairingFailed) throw e;
          console.error(e);
          throw new CantOpenDevice(e.message);
        })
        // Executes the job
        .then(transport => {
          tracer.trace("Executing job", { hasTransport: !!transport, unsubscribed });
          if (!transport) return;

          // It was unsubscribed prematurely
          if (unsubscribed) {
            tracer.trace("Unsubscribed before executing job");
            return finalize(transport);
          }

          sub = job(transport)
            .pipe(
              catchError(error => initialErrorRemapping(error, tracer.getContext())),
              catchError(errorRemapping),
              transportFinally(() => {
                // Closes the transport and cleans up everything
                return finalize(transport);
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
                if (error.statusCode) {
                  o.error(new TransportStatusError(error.statusCode));
                } else {
                  o.error(error);
                }
              },
              complete: () => {
                o.complete();
              },
            });
        })
        .catch(error => {
          tracer.trace(`Caught error on job execution step: ${error}`, { error });
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

/**
 * Provides a Transport instance to the given function fn
 * @see withDevice
 */
export const withDevicePromise = <T>(deviceId: string, fn: (Transport) => Promise<T>) =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(transport))));

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
