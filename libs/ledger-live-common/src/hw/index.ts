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
  wired?: boolean;
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
  ) => Promise<Transport> | null | undefined;
  // here, close means we want to STOP doing something with the transport
  close?: (transport: Transport, id: string) => Promise<void> | null | undefined;
  // disconnect/interrupt a device connection globally
  // returns falsy if the transport module can't handle this id
  disconnect: (id: string) => Promise<void> | null | undefined;

  /**
   * Determines whether an auto-disconnect can happen at this time or not.
   *
   * Currently only used by TransportNodeHid
   */
  setAllowAutoDisconnect?: (
    transport: Transport,
    id: string,
    allow: boolean,
  ) => Promise<void> | null | undefined;

  // optional observable that allows to discover a transport
  discovery?: Discovery;
};

const modules: TransportModule[] = [];
export const registerTransportModule = (module: TransportModule): void => {
  modules.push(module);
};

export const discoverDevices = (
  accept: (module: TransportModule) => boolean = () => true,
): Discovery => {
  const all: Discovery[] = [];

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
  timeoutMs?: number,
  context?: TraceContext,
): Promise<Transport> => {
  // The first registered Transport (TransportModule) accepting the given device will be returned.
  // The open is not awaited, the check on the device is done synchronously.
  // A TransportModule can check the prefix of the device id to guess if it should use USB or not on LLM for ex.
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.open(deviceId, timeoutMs, context);
    if (p) {
      trace({
        type: LOG_TYPE,
        message: `Found a matching Transport: ${m.id}`,
        context,
        data: { timeoutMs },
      });

      if (!timeoutMs) {
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
        new Promise((_resolve, reject) => {
          timer = setTimeout(() => {
            trace({
              type: LOG_TYPE,
              message: `Could not open registered transport ${m.id} on ${deviceId}, timed out after ${timeoutMs}ms`,
              context,
            });

            return reject(new CantOpenDevice(`Timeout while opening device on transport ${m.id}`));
          }, timeoutMs);
        }),
      ]) as Promise<Transport>;
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

/**
 * TODO: fix this, or remove comments.
 *
 * Currently only used by TransportNodeHid.
 * But the logic seems wrong to find the module to call `setAllowAutoDisconnect` on:
 * the 1st registered module that defines `setAllowAutoDisconnect` will be chosen, while
 * it could be another module that can handle the transport.
 */
export const setAllowAutoDisconnect = (
  transport: Transport,
  deviceId: string,
  allow: boolean,
): Promise<void> | null | undefined => {
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.setAllowAutoDisconnect && m.setAllowAutoDisconnect(transport, deviceId, allow);
    if (p) return p;
  }
};

export const disconnect = (deviceId: string): Promise<void> => {
  for (let i = 0; i < modules.length; i++) {
    const dis = modules[i].disconnect;
    const p = dis(deviceId);

    if (p) {
      return p;
    }
  }

  return Promise.reject(new Error(`Can't find handler to disconnect ${deviceId}`));
};
