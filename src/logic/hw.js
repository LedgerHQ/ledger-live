// @flow

import { Observable } from "rxjs/Observable";

import type { Transport } from "@ledgerhq/hw-transport";
import HIDTransport from "@ledgerhq/react-native-hid";
import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
import { withStaticURL } from "@ledgerhq/hw-transport-http";
import Config from "react-native-config";

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
const bleObservable = Observable.create(o => BluetoothTransport.listen(o)).map(
  ({ descriptor }) => ({
    type: "ble",
    id: `ble|${descriptor.id}`,
    name: descriptor.name,
  }),
);
openHandlers.push(id => {
  if (id.startsWith("ble|")) {
    return BluetoothTransport.open(id.slice(4));
  }
  return null;
});
observables.push(bleObservable);

// Add support of HID
const hidObservable = Observable.create(o => BluetoothTransport.listen(o)).map(
  () => ({
    type: "usb",
    id: "usb",
    name: "USB device",
  }),
);
openHandlers.push(id => {
  if (id === "usb") {
    return HIDTransport.open(null);
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
  ).map(() => ({
    type: "httpdebug",
    id: `httpdebug|${DEBUG_COMM_HTTP_PROXY}`,
    name: "USB device",
  }));
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
}> = Observable.merge(
  ...observables.map(o =>
    o.catch(e => {
      console.warn(`discover failure ${e}`);
      return Observable.empty();
    }),
  ),
);

export const open = (deviceId: string): Promise<Transport<*>> => {
  const p = openHandlers.find(open => open(deviceId));
  if (!p) {
    return Promise.reject(new Error(`Can't find handler to open ${deviceId}`));
  }
  return p;
};
