// @flow
import Config from "react-native-config";
import { Observable } from "rxjs/Observable";
import { map } from "rxjs/operators/map";
import HIDTransport from "@ledgerhq/react-native-hid";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import { setEnv } from "@ledgerhq/live-common/lib/env";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
import { logsObservable } from "@ledgerhq/react-native-hw-transport-ble/lib/debug";

import network from "./api/network";

if (Config.BLE_LOG_LEVEL) BluetoothTransport.setLogLevel(Config.BLE_LOG_LEVEL);
if (Config.DEBUG_BLE)
  logsObservable.subscribe(e => {
    console.log(e.type + ": " + e.message); // eslint-disable-line no-console
  });

setNetwork(network);
setEnv("FORCE_PROVIDER", Config.FORCE_PROVIDER);

// Add support of HID (experimental until we stabilize it)

registerTransportModule({
  id: "hid",
  open: id => {
    if (id.startsWith("usb|")) {
      const json = JSON.parse(id.slice(4));
      return HIDTransport.open(json);
    }
    return null;
  },
  disconnect: id =>
    id.startsWith("usb|")
      ? Promise.resolve() // nothing to do
      : null,
  discovery: Observable.create(o => HIDTransport.listen(o)).pipe(
    map(({ type, descriptor }) => ({
      type,
      id: `usb|${JSON.stringify(descriptor)}`,
      name: "USB device",
    })),
  ),
});

// Add dev mode support of an http proxy

let DebugHttpProxy;
const httpdebug: TransportModule = {
  id: "httpdebug",
  open: id =>
    id.startsWith("httpdebug|") ? DebugHttpProxy.open(id.slice(10)) : null,
  disconnect: id =>
    id.startsWith("httpdebug|")
      ? Promise.resolve() // nothing to do
      : null,
};
if (__DEV__ && Config.DEBUG_COMM_HTTP_PROXY) {
  DebugHttpProxy = withStaticURLs(Config.DEBUG_COMM_HTTP_PROXY.split("|"));
  httpdebug.discovery = Observable.create(o => DebugHttpProxy.listen(o)).pipe(
    map(({ type, descriptor }) => ({
      type,
      id: `httpdebug|${descriptor}`,
      name: descriptor,
    })),
  );
} else {
  DebugHttpProxy = withStaticURLs([]);
}
registerTransportModule(httpdebug);

// BLE is always the fallback choice because we always keep raw id in it

registerTransportModule({
  id: "ble",
  // $FlowFixMe
  open: id => BluetoothTransport.open(id),
  disconnect: id => BluetoothTransport.disconnect(id),
});
