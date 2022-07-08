import { EMPTY, merge } from "rxjs";
import type { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
type Discovery = Observable<{
  type: "add" | "remove";
  id: string;
  name: string;
}>;
// NB open/close/disconnect semantic will have to be refined...
export type TransportModule = {
  // unique transport name that identify the transport module
  id: string;
  // open a device by an id, this id must be unique across all modules
  // you can typically prefix it with `something|` that identify it globally
  // returns falsy if the transport module can't handle this id
  // here, open means we want to START doing something with the transport
  open: (id: string) => Promise<Transport> | null | undefined;
  // here, close means we want to STOP doing something with the transport
  close?: (
    transport: Transport,
    id: string
  ) => Promise<void> | null | undefined;
  // disconnect/interrupt a device connection globally
  // returns falsy if the transport module can't handle this id
  disconnect: (id: string) => Promise<void> | null | undefined;
  // here, setAllowAutoDisconnect determines whether an autodisconnect can
  // happen at this time or not. Currently only used by TransportNodeHid
  setAllowAutoDisconnect?: (
    transport: Transport,
    id: string,
    allow: boolean
  ) => Promise<void> | null | undefined;
  // _without connecting to the device_ return whether the device is capable
  // of handling a given deviceId for connection. This is used by BIM to know
  // if a given device will be using that transport without modifying its ID
  canOpen?: (id: string) => boolean | undefined;
  // optional observable that allows to discover a transport
  discovery?: Discovery;
};
const modules: TransportModule[] = [];
export const registerTransportModule = (module: TransportModule) => {
  modules.push(module);
};
export const resolveTransportModuleForDeviceId = (
  deviceId: string
): TransportModule | undefined =>
  modules.find((m) => m.canOpen && m.canOpen(deviceId));

export const discoverDevices = (
  accept: (module: TransportModule) => boolean = () => true
): Discovery => {
  const all: Discovery[] = [];

  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];

    if (m.discovery && accept(m)) {
      all.push(m.discovery);
    }
  }

  return merge(
    ...all.map((o) =>
      o.pipe(
        catchError((e) => {
          console.warn(`One Transport provider failed: ${e}`);
          return EMPTY;
        })
      )
    )
  );
};
export const open = (deviceId: string): Promise<Transport> => {
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.open(deviceId);
    if (p) return p;
  }

  return Promise.reject(new Error(`Can't find handler to open ${deviceId}`));
};
export const close = (
  transport: Transport,
  deviceId: string
): Promise<void> => {
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.close && m.close(transport, deviceId);
    if (p) return p;
  }

  // fallback on an actual close
  return transport.close();
};
export const setAllowAutoDisconnect = (
  transport: Transport,
  deviceId: string,
  allow: boolean
): Promise<void> | null | undefined => {
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p =
      m.setAllowAutoDisconnect &&
      m.setAllowAutoDisconnect(transport, deviceId, allow);
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

  return Promise.reject(
    new Error(`Can't find handler to disconnect ${deviceId}`)
  );
};
