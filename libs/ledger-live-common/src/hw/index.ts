import { EMPTY, merge } from "rxjs";
import type { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import type { DeviceModel } from "@ledgerhq/types-devices";
import Transport from "@ledgerhq/hw-transport";
import { TraceContext, trace } from "@ledgerhq/logs";
import { CantOpenDevice } from "@ledgerhq/errors";

export const LOG_TYPE = "hw";

export type DeviceEvent = {
  type: "add" | "remove";
  id: string;
  name: string;
  deviceModel?: DeviceModel | null;
  wired: boolean;
};

export type Discovery = Observable<DeviceEvent>;

// NB open/close/disconnect semantic will have to be refined...
export type TransportModule = {
  // unique transport name that identify the transport module
  id: string;
  /*
   * Opens a device by an id, this id must be unique across all modules
   * you can typically prefix it with `something|` that identify it globally
   * returns falsy if the transport module can't handle this id
   * here, open means we want to START doing something with the transport
   *
   * @param id
   * @param timeoutMs Optional timeout that can be used by the Transport implementation when opening a communication channel
   * @param context Optional context to be used in logs/tracing
   */
  open: (
    id: string,
    timeoutMs?: number,
    context?: TraceContext,
    matchDeviceByName?: string,
  ) => Promise<Transport> | null | undefined;
  // here, close means we want to STOP doing something with the transport
  close?: (transport: Transport, id: string) => Promise<void> | null | undefined;
  // disconnect/interrupt a device connection globally
  // returns falsy if the transport module can't handle this id
  disconnect: (id: string) => Promise<void> | null | undefined;

  // optional observable that allows to discover a transport
  discovery?: Discovery;
};

declare global {
  interface GlobalThis {
    __ledgerTransportModules?: TransportModule[];
  }
}

/**
 * Uses globalThis to ensure a single shared registry across all module instances,
 * which is critical when modules are lazy-loaded and may resolve to separate copies.
 */
function getModules(): TransportModule[] {
  if (!globalThis.__ledgerTransportModules) {
    globalThis.__ledgerTransportModules = [];
  }
  return globalThis.__ledgerTransportModules;
}

export const registerTransportModule = (module: TransportModule): void => {
  getModules().push(module);
};

export const unregisterTransportModule = (moduleId: string): void => {
  const modules = getModules();
  const index = modules.findIndex(m => m.id === moduleId);
  if (index !== -1) {
    modules.splice(index, 1);
  }
};

export const unregisterAllTransportModules = (): void => {
  getModules().length = 0;
};

export const discoverDevices = (
  accept: (module: TransportModule) => boolean = () => true,
): Discovery => {
  const all: Discovery[] = [];

  const modules = getModules();
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];

    if (m.discovery && accept(m)) {
      all.push(m.discovery);
    }
  }

  return merge(
    ...all.map(o =>
      o.pipe(
        catchError(error => {
          trace({ type: LOG_TYPE, message: "One Transport provider failed", data: { error } });
          return EMPTY;
        }),
      ),
    ),
  );
};

export type OpenOptions = {
  openTimeoutMs?: number;
  matchDeviceByName?: string;
};

/**
 * Tries to call `open` on the 1st matching registered transport implementation
 *
 * An optional timeout `timeoutMs` can be set. It is/can be used in 2 different places:
 * - A `timeoutMs` timeout is applied directly in this function: racing between the matching Transport opening and this timeout
 * - And the `timeoutMs` parameter is also passed to the `open` method of the transport module so each transport implementation
 *  can make use of that parameter and implement their timeout mechanism internally
 *
 * Why using it in 2 places ?
 * As there is no easy way to abort a Promise (returned by `open`), the Transport will continue to try connecting to the device
 * even if this function timeout was reached. But certain Transport implementations can also use this timeout to try to stop
 * the connection attempt internally.
 *
 * @param deviceId
 * @param timeoutMs Optional timeout that limits in time the open attempt of the matching registered transport.
 * @param context Optional context to be used in logs
 * @returns a Promise that resolves to a Transport instance, and rejects with a `CantOpenDevice`
 *   if no transport implementation can open the device
 */
export const open = (
  deviceId: string,
  options?: OpenOptions,
  context?: TraceContext,
): Promise<Transport> => {
  // The first registered Transport (TransportModule) accepting the given device will be returned.
  // The open is not awaited, the check on the device is done synchronously.
  // A TransportModule can check the prefix of the device id to guess if it should use USB or not on LLM for ex.
  const modules = getModules();
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.open(deviceId, options?.openTimeoutMs, context, options?.matchDeviceByName);
    if (p) {
      trace({
        type: LOG_TYPE,
        message: `Found a matching Transport: ${m.id}`,
        context,
        data: { options },
      });

      if (!options?.openTimeoutMs) {
        return p;
      }

      let timer: ReturnType<typeof setTimeout> | null = null;

      // Throws CantOpenDevice on timeout, otherwise returns the transport.
      // Important: with Javascript Promise, when one promise finishes,
      // the other will still continue, even if its return value will be discarded.
      return Promise.race([
        p.then(transport => {
          // Necessary to stop the ongoing timeout
          if (timer) {
            clearTimeout(timer);
          }

          return transport;
        }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            trace({
              type: LOG_TYPE,
              message: `Could not open registered transport ${m.id} on ${deviceId}, timed out after ${options?.openTimeoutMs}ms`,
              context,
            });

            return reject(new CantOpenDevice(`Timeout while opening device on transport ${m.id}`));
          }, options?.openTimeoutMs);
        }),
      ]);
    }
  }
  return Promise.reject(new CantOpenDevice(`Cannot find registered transport to open ${deviceId}`));
};

export const close = (
  transport: Transport,
  deviceId: string,
  context?: TraceContext,
): Promise<void> => {
  trace({ type: LOG_TYPE, message: "Trying to close transport", context });

  // Tries to call close on the registered TransportModule implementation first
  const modules = getModules();
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.close && m.close(transport, deviceId);
    if (p) {
      trace({
        type: LOG_TYPE,
        message: `Closing transport via registered module: ${m.id}`,
        context,
      });
      return p;
    }
  }

  trace({ type: LOG_TYPE, message: `Closing transport via the transport implementation`, context });
  // Otherwise fallbacks on the transport implementation of close directly
  return transport.close();
};

export const disconnect = (deviceId: string): Promise<void> => {
  const modules = getModules();
  for (let i = 0; i < modules.length; i++) {
    const dis = modules[i].disconnect;
    const p = dis(deviceId);

    if (p) {
      return p;
    }
  }

  return Promise.reject(new Error(`Can't find handler to disconnect ${deviceId}`));
};
