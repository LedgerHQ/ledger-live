import { Observable, throwError } from "rxjs";
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import { open, close, setAllowAutoDisconnect } from "../../hw/index";
import {
  BluetoothRequired,
  CantOpenDevice,
  DeviceHalted,
  FirmwareOrAppUpdateRequired,
  TransportInterfaceNotAvailable,
  TransportStatusError,
  TransportWebUSBGestureRequired,
} from "@ledgerhq/errors";
import { catchError } from "rxjs/operators";

export { Transport };

// The devicesQueues object only stores, for each device, the latest void promise that will resolve when the device is ready to be opened again.
// They are scheduled to resolve whenever the job associated to the device is finished.
// When calling withTransport several times, the new promise will be chained to the "then" of the previous promise:
// open(device) -> execute job -> clean connection -> resolve promise -> next promise can start: open(device) -> etc.
// So a queue is indeed created for each device, by creating a chain of promises, but only the end of the queue is stored for each device.
const deviceQueues: { [deviceId: string]: Promise<void> } = {};

const identifyTransport = (t) => (typeof t.id === "string" ? t.id : "");

const needsCleanup = {};
// When a series of APDUs are interrupted, this is called
// so we don't forget to cleanup on the next withTransport
export const cancelDeviceAction = (transport: Transport): void => {
  needsCleanup[identifyTransport(transport)] = true;
};

// To be able to differentiate withTransport calls in our logs
let withRefreshableTransportNonce = 0;

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

/**
 * Wrapper providing a transport that can be refreshed to a job that can be executed
 *
 * This is useful for any job that may need to refresh the transport because of a device disconnected-like error
 *
 * The transportRef.current will be updated with the new transport when transportRef.refreshTransport is called
 *
 * @param deviceId the id of the device to open the transport channel with
 * @returns a function that takes a job and returns an observable on the result of the job
 *  job: the job to execute with the transport. It takes:
 *   - transportRef: a reference to the transport that can be updated by calling a transportRef.refreshTransport()
 */
export const withTransport = (deviceId: string) => {
  return <T>(
    job: ({ transportRef }: JobArgs) => Observable<T>
  ): Observable<T> =>
    new Observable((subscriber) => {
      const nonce = withRefreshableTransportNonce++;
      log("withTransport", `${nonce}: New job: deviceId=${deviceId || "USB"}`);

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

      log("withTransport", `${nonce}: Waiting for queue to complete`, {
        deviceQueue,
      });

      const setupTransport = async (transport: Transport) => {
        log("withTransport", `${nonce}: Starting job`);
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
      };

      // This catch is here only for errors that might happen at open or at clean up of the transport before doing the job
      const onErrorDuringTransportSetup = (error: unknown) => {
        resolveQueuedDevice();
        if (error instanceof BluetoothRequired) throw error;
        if (error instanceof TransportWebUSBGestureRequired) throw error;
        if (error instanceof TransportInterfaceNotAvailable) throw error;
        if (error instanceof Error) throw new CantOpenDevice(error.message);
        else throw new CantOpenDevice("Unknown error");
      };

      // Returns an object containing: the reference to a transport and a function to refresh it
      const buildRefreshableTransport = (
        transport: Transport
      ): TransportRef => {
        const transportRef: TransportRef = {
          current: transport,
          _refreshedCounter: 0,
          refreshTransport: Promise.resolve,
        };

        transportRef.refreshTransport = async () => {
          return (
            close(transportRef.current, deviceId)
              // Silently ignore errors on transport close
              .catch(() => {})
              .then(async () => open(deviceId))
              .then(async (newTransport) => {
                await setupTransport(transportRef.current);

                transportRef.current = newTransport;
                transportRef._refreshedCounter++;
              })
              .catch(onErrorDuringTransportSetup)
          );
        };

        return transportRef;
      };

      deviceQueue
        .then(() => {
          return open(deviceId);
        })
        .then((transport) => {
          return buildRefreshableTransport(transport);
        })
        .then(async (transportRef: TransportRef) => {
          await setupTransport(transportRef.current);

          return transportRef;
        })
        .catch(onErrorDuringTransportSetup)
        // Executes the job
        .then((transportRef) => {
          if (!transportRef.current) return;

          if (unsubscribed) {
            // It was unsubscribed prematurely
            return finalize(transportRef.current, [resolveQueuedDevice]);
          }

          sub = job({ transportRef })
            .pipe(
              catchError(initialErrorRemapping),
              catchError(errorRemapping), // close the transport and clean up everything
              transportFinally(() => {
                log("withTransport", `${nonce}: job fully completed`);
                return finalize(transportRef.current, [resolveQueuedDevice]);
              })
            )
            .subscribe(subscriber);
        })
        .catch((error) => {
          subscriber.error(error);
        });

      // Returns function to unsubscribe from the job if we don't need it anymore.
      // This will prevent us from executing the job unnecessarily later on
      return () => {
        log("withTransport", `${nonce}: Unsubscribing job: ${!!sub}`);
        unsubscribed = true;
        if (sub) sub.unsubscribe();
      };
    });
};

const transportFinally =
  (cleanup: () => Promise<void>) =>
  <T>(observable: Observable<T>): Observable<T> =>
    new Observable((o) => {
      let done = false;

      const finalize = () => {
        if (done) return Promise.resolve();
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

const initialErrorRemapping = (error) => {
  return throwError(
    error &&
      error instanceof TransportStatusError &&
      // @ts-expect-error typescript not checking agains the instanceof
      error.statusCode === 0x6faa
      ? new DeviceHalted(error.message)
      : error.statusCode === 0x6b00
      ? new FirmwareOrAppUpdateRequired(error.message)
      : error
  );
};

let errorRemapping = (e) => throwError(e);
export const setErrorRemapping = (
  f: (arg0: Error) => Observable<never>
): void => {
  errorRemapping = f;
};
