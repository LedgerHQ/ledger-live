// @flow

import { Observable } from "rxjs/Observable";
import { empty, merge } from "rxjs";
import { map } from "rxjs/operators/map";
import { catchError } from "rxjs/operators/catchError";

import type Transport from "@ledgerhq/hw-transport";
import HIDTransport from "@ledgerhq/react-native-hid";
import { withStaticURL } from "@ledgerhq/hw-transport-http";
import Config from "react-native-config";
import Eth from "@ledgerhq/hw-app-eth";

import BluetoothTransport from "../react-native-hw-transport-ble";

export async function tmpTestEthExchange(deviceId: string) {
  const t = await open(deviceId);
  const eth = new Eth(t);
  const r = await eth.getAddress("44'/60'/0'/0/0");
  console.warn("eth.getAddress:", r);
}

const transports: { [_: string]: * } = {
  HIDTransport,
  BluetoothTransport,
};
if (__DEV__) {
  transports.DebugHttpProxy = withStaticURL(Config.DEBUG_COMM_HTTP_PROXY);
}

const observables = [];
const openHandlers: Array<(string) => ?Promise<Transport<*>>> = [];

// Add support of BLE
const bleObservable = Observable.create(o => BluetoothTransport.listen(o)).pipe(
  map(({ descriptor }) => ({
    type: "ble",
    id: `ble|${descriptor.id}`,
    name: descriptor.name,
  })),
);
openHandlers.push(id => {
  if (id.startsWith("ble|")) {
    return BluetoothTransport.open(id.slice(4));
  }
  return null;
});
observables.push(bleObservable);

// Add support of HID
const hidObservable = Observable.create(o => BluetoothTransport.listen(o)).pipe(
  map(({ descriptor }) => ({
    type: "usb",
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
observables.push(hidObservable);

// Add dev mode support of an http proxy
if (__DEV__) {
  const { DEBUG_COMM_HTTP_PROXY } = Config;
  const DebugHttpProxy = withStaticURL(DEBUG_COMM_HTTP_PROXY);
  const debugHttpObservable = Observable.create(o =>
    DebugHttpProxy.listen(o),
  ).pipe(
    map(({ descriptor }) => ({
      type: "httpdebug",
      id: `httpdebug|${descriptor}`,
      name: descriptor,
    })),
  );
  openHandlers.push(id => {
    if (id.startsWith("httpdebug|")) {
      return DebugHttpProxy.open(id.slice(10));
    }
    return null;
  });
  observables.push(debugHttpObservable);
}

export const devicesObservable: Observable<{
  type: string,
  id: string,
  name: string,
}> = merge(
  ...observables.map(o =>
    o.pipe(
      catchError(e => {
        console.warn(`One Transport provider failed: ${e}`);
        return empty();
      }),
    ),
  ),
);

export const open = (deviceId: string): Promise<Transport<*>> => {
  for (let i = 0; i < openHandlers.length; i++) {
    const open = openHandlers[i];
    const p = open(deviceId);
    if (p) return p;
  }
  return Promise.reject(new Error(`Can't find handler to open ${deviceId}`));
};
