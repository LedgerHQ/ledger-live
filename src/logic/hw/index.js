// @flow

import { Observable } from "rxjs/Observable";
import { empty, merge } from "rxjs";
import { map } from "rxjs/operators/map";
import { catchError } from "rxjs/operators/catchError";

import type Transport from "@ledgerhq/hw-transport";
import HIDTransport from "@ledgerhq/react-native-hid";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import Config from "react-native-config";

import BluetoothTransport from "../../react-native-hw-transport-ble";

const observables = [];
const usbObservables = [];
const openHandlers: Array<(string) => ?Promise<Transport<*>>> = [];
const disconnectHandlers: Array<(string) => ?Promise<void>> = [];

// Add support of HID
const hidObservable = Observable.create(o => HIDTransport.listen(o)).pipe(
  map(({ type, descriptor }) => ({
    type,
    id: `usb|${JSON.stringify(descriptor)}`,
    name: "USB device",
  })),
);
openHandlers.push(id => {
  if (id.startsWith("usb|")) {
    const json = JSON.parse(id.slice(4));
    // $FlowFixMe: we should have concept of id in HIDTransport
    return HIDTransport.open(json);
  }
  return null;
});
disconnectHandlers.push(
  id =>
    id.startsWith("usb|")
      ? Promise.resolve() // nothing to do
      : null,
);

usbObservables.push(hidObservable);

// Add dev mode support of an http proxy
let DebugHttpProxy;
if (__DEV__ && Config.DEBUG_COMM_HTTP_PROXY) {
  DebugHttpProxy = withStaticURLs(Config.DEBUG_COMM_HTTP_PROXY.split("|"));
  const debugHttpObservable = Observable.create(o =>
    DebugHttpProxy.listen(o),
  ).pipe(
    map(({ type, descriptor }) => ({
      type,
      id: `httpdebug|${descriptor}`,
      name: descriptor,
    })),
  );
  observables.push(debugHttpObservable);
} else {
  DebugHttpProxy = withStaticURLs([]);
}

openHandlers.push(
  id =>
    id.startsWith("httpdebug|")
      ? // $FlowFixMe wtf
        DebugHttpProxy.open(id.slice(10))
      : null,
);
disconnectHandlers.push(
  id =>
    id.startsWith("httpdebug|")
      ? Promise.resolve() // nothing to do
      : null,
);

export const getDevicesObservable = ({
  usb,
}: {
  usb: boolean,
}): Observable<{
  type: string,
  id: string,
  name: string,
}> =>
  merge(
    ...(usb ? usbObservables : []),
    ...observables.map(o =>
      o.pipe(
        catchError(e => {
          console.warn(`One Transport provider failed: ${e}`);
          return empty();
        }),
      ),
    ),
  );

// Add support of BLE
// it is always the fallback choice because we always keep raw id in it.
// NB: we don't use ble observable because it will be given on ble redux state side
openHandlers.push(id =>
  // $FlowFixMe subtyping god help me
  BluetoothTransport.open(id),
);
disconnectHandlers.push(id =>
  // $FlowFixMe subtyping god help me
  BluetoothTransport.disconnect(id),
);

export const open = (deviceId: string): Promise<Transport<*>> => {
  for (let i = 0; i < openHandlers.length; i++) {
    const open = openHandlers[i];
    const p = open(deviceId);
    if (p) {
      if (__DEV__) {
        return p.then(p => {
          p.setDebugMode(true);
          return p;
        });
      }
      return p;
    }
  }
  return Promise.reject(new Error(`Can't find handler to open ${deviceId}`));
};

export const disconnect = (deviceId: string): Promise<void> => {
  for (let i = 0; i < disconnectHandlers.length; i++) {
    const dis = disconnectHandlers[i];
    const p = dis(deviceId);
    if (p) {
      return p;
    }
  }
  return Promise.reject(
    new Error(`Can't find handler to disconnect ${deviceId}`),
  );
};
