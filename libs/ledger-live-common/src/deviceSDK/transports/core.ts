import { Observable, throwError } from "rxjs";
import { LocalTracer, TraceContext, trace } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import { open, close, setAllowAutoDisconnect } from "../../hw/index";
import {
  BluetoothRequired,
  CantOpenDevice,
  DeviceHalted,
  FirmwareOrAppUpdateRequired,
  PairingFailed,
  PeerRemovedPairing,
  TransportInterfaceNotAvailable,
  TransportStatusError,
  TransportWebUSBGestureRequired,
} from "@ledgerhq/errors";
import { catchError } from "rxjs/operators";

export { Transport };

const LOG_TYPE = "device-sdk-transport";

const identifyTransport = t => (typeof t.id === "string" ? t.id : "");

const needsCleanup = {};
// When a series of APDUs are interrupted, this is called
// so we don't forget to cleanup on the next withTransport
export const cancelDeviceAction = (transport: Transport): void => {
  const transportId = identifyTransport(transport);
  trace({
    type: LOG_TYPE,
    message: "Cancelling device action",
    data: { transportId },
  });

  needsCleanup[identifyTransport(transport)] = true;
};

export type TransportRef = {
  // the instance of the current opened transport
  current: Transport;
  // A function that closes and re-opens a transport
  refreshTransport: () => Promise<void>;
  // (for debug purposes) A counter that is incremented each time the transport is refreshed
  _refreshedCounter: number;
};

export type JobArgs = {
  transportRef: TransportRef;
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
 * Wrapper providing a transport that can be refreshed to a job that can be executed
 *
 * This is useful for any job that may need to refresh the transport because of a device disconnected-like error
 *
 * The transportRef.current will be updated with the new transport when transportRef.refreshTransport is called
 *
 * @param deviceId the id of the device to open the transport channel with
 * @param options contains optional configuration
 *   - openTimeoutMs: TODO: to keep, will be used in a separate PR
 * @returns a function that takes a job and returns an observable on the result of the job
 *  job: the job to execute with the transport. It takes:
 *   - transportRef: a reference to the transport that can be updated by calling a transportRef.refreshTransport()
 */
export const withTransport = (deviceId: string, options?: { openTimeoutMs?: number }) => {
  return <T>(job: ({ transportRef }: JobArgs) => Observable<T>): Observable<T> =>
    new Observable(subscriber => {
      jobId++;
      const tracer = new LocalTracer(LOG_TYPE, { jobId: jobId, origin: "deviceSdk:withTransport" });
      tracer.trace(`New job for device: ${deviceId || "USB"}`);

      let unsubscribed;
      let sub;
      const deviceQueue = deviceQueues[deviceId] || { job: Promise.resolve(), id: -1 };

      // To call to cleanup the current transport
      const finalize = (transport, cleanups) => {
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

      // Setups a given transport
      const setupTransport = async (transport: Transport) => {
        tracer.trace("Setting up the transport instance");
        setAllowAutoDisconnect(transport, deviceId, false);

        if (unsubscribed) {
          tracer.trace("Unsubscribed (1) while processing job");
          // It was unsubscribed prematurely
          return finalize(transport, [resolveQueuedJob]);
        }

        if (needsCleanup[identifyTransport(transport)]) {
          delete needsCleanup[identifyTransport(transport)];
          await transport.send(0, 0, 0, 0).catch(() => {});
        }

        return transport;
      };

      // This catch is here only for errors that might happen at open or at clean up of the transport before doing the job
      const onErrorDuringTransportSetup = (error: unknown) => {
        tracer.trace("Error while setting up a transport: ", { error });
        resolveQueuedJob();
        if (error instanceof BluetoothRequired) throw error;
        if (error instanceof TransportWebUSBGestureRequired) throw error;
        if (error instanceof TransportInterfaceNotAvailable) throw error;
        if (error instanceof PeerRemovedPairing) throw error;
        if (error instanceof PairingFailed) throw error;
        if (error instanceof Error) throw new CantOpenDevice(error.message);
        else throw new CantOpenDevice("Unknown error");
      };

      // Returns an object containing: the reference to a transport and a function to refresh it
      const buildRefreshableTransport = (transport: Transport): TransportRef => {
        tracer.trace("Creating a refreshable transport from a given instance");

        const transportRef: TransportRef = {
          current: transport,
          _refreshedCounter: 0,
          refreshTransport: Promise.resolve,
        };

        tracer.updateContext({ transportRefreshedCounter: transportRef._refreshedCounter });

        transportRef.refreshTransport = async () => {
          tracer.trace("Refreshing current transport");
          return (
            close(transportRef.current, deviceId)
              // Silently ignore errors on transport close
              .catch(() => {})
              .then(async () => open(deviceId, options?.openTimeoutMs, tracer.getContext()))
              .then(async newTransport => {
                await setupTransport(transportRef.current);

                transportRef.current = newTransport;
                transportRef._refreshedCounter++;
                tracer.updateContext({ transportRefreshedCounter: transportRef._refreshedCounter });
                tracer.trace("Transport was refreshed");
              })
              .catch(onErrorDuringTransportSetup)
          );
        };

        return transportRef;
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
        })
        .then(transport => {
          return buildRefreshableTransport(transport);
        })
        .then(async (transportRef: TransportRef) => {
          await setupTransport(transportRef.current);

          return transportRef;
        })
        .catch(onErrorDuringTransportSetup)
        // Executes the job
        .then(transportRef => {
          tracer.trace("Executing job", { hasTransport: !!transportRef, unsubscribed });
          if (!transportRef.current) return;

          if (unsubscribed) {
            tracer.trace("Unsubscribed (2) while processing job");
            // It was unsubscribed prematurely
            return finalize(transportRef.current, [resolveQueuedJob]);
          }

          sub = job({ transportRef })
            .pipe(
              catchError(error => initialErrorRemapping(error, tracer.getContext())),
              catchError(errorRemapping), // close the transport and clean up everything
              transportFinally(() => {
                return finalize(transportRef.current, [resolveQueuedJob]);
              }),
            )
            .subscribe(subscriber);
        })
        .catch(error => {
          subscriber.error(error);
        });

      // Returns function to unsubscribe from the job if we don't need it anymore.
      // This will prevent us from executing the job unnecessarily later on
      return () => {
        tracer.trace(`Unsubscribing withDevice flow. Ongoing job to unsubscribe from ? ${!!sub}`);
        unsubscribed = true;
        if (sub) sub.unsubscribe();
      };
    });
};

/**
 * Wrapper to pipe a "cleanup" function at then end of an Observable flow.
 *
 * The `finalize` is only called once if there is an error and a complete
 * (but normally an error event completes automatically the Observable pipes. Is it needed ?)
 */
const transportFinally =
  (cleanup: () => Promise<void>) =>
  <T>(observable: Observable<T>): Observable<T> =>
    new Observable(o => {
      let done = false;

      const finalize = () => {
        if (done) return Promise.resolve();
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
