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
 * @param deviceId
 * @param timeoutMs TODO: too keep, will be used in separate PR
 * @param context Optional context to be used in logs/tracing
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
    if (p) return p;
  }

  return Promise.reject(new CantOpenDevice(`Cannot find registered transport to open ${deviceId}`));
};

export const close = (
  transport: Transport,
  deviceId: string,
  context?: TraceContext,
): Promise<void> => {
  trace({ type: LOG_TYPE, message: "Trying to close transport", context });
  // Tries on the registered TransportModule implementation of close
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.close && m.close(transport, deviceId);
    if (p) {
      trace({ type: LOG_TYPE, message: `Closing transport ${m.id}`, context });
      return p;
    }
  }

  // fallback on an actual close
  return transport.close();
};
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
