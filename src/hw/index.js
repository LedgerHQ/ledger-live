// @flow

import { Observable } from "rxjs/Observable";
import { empty, merge } from "rxjs";
import { catchError } from "rxjs/operators/catchError";

import type Transport from "@ledgerhq/hw-transport";

type Discovery = Observable<{
  type: "add" | "remove",
  id: string,
  name: string
}>;

export type TransportModule = {
  // unique transport name that identify the transport module
  id: string,
  // open a device by an id, this id must be unique across all modules
  // you can typically prefix it with `something|` that identify it globally
  // returns falsy if the transport module can't handle this id
  open: (id: string) => ?Promise<Transport<*>>,
  // disconnect/interrupt a device connection globally
  // returns falsy if the transport module can't handle this id
  disconnect: (id: string) => ?Promise<void>,
  // optional observable that allows to discover a transport
  discovery?: Discovery
};

const modules: TransportModule[] = [];

export const registerTransportModule = (module: TransportModule) => {
  modules.push(module);
};

export const discoverDevices = (
  accept: (module: TransportModule) => boolean = () => true
): Observable<{
  id: string,
  name: string
}> => {
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
        catchError(e => {
          console.warn(`One Transport provider failed: ${e}`);
          return empty();
        })
      )
    )
  );
};

export const open = (deviceId: string): Promise<Transport<*>> => {
  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const p = m.open(deviceId);
    if (p) return p;
  }
  return Promise.reject(new Error(`Can't find handler to open ${deviceId}`));
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
