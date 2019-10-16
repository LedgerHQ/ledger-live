// @flow
import Config from "react-native-config";
import { Observable } from "rxjs/Observable";
import { map } from "rxjs/operators/map";
import { listen } from "@ledgerhq/logs";
import HIDTransport from "@ledgerhq/react-native-hid";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import { logs } from "@ledgerhq/live-common/lib/api/socket";
import { retry } from "@ledgerhq/live-common/lib/promise";
import { setEnv } from "@ledgerhq/live-common/lib/env";
import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import BluetoothTransport from "./react-native-hw-transport-ble";
import network from "./api/network";
import "./experimental";

setSupportedCurrencies([
  "bitcoin_cash",
  "bitcoin_gold",
  "bitcoin_testnet",
  "bitcoin",
  "clubcoin",
  "dash",
  "decred",
  "digibyte",
  "dogecoin",
  "ethereum_classic",
  "ethereum",
  "hcash",
  "komodo",
  "litecoin",
  "peercoin",
  "pivx",
  "poswallet",
  "qtum",
  "ripple",
  "stealthcoin",
  "stratis",
  "vertcoin",
  "viacoin",
  "stakenet",
  "zcash",
  "zencash",
]);

if (Config.VERBOSE) {
  listen(({ type, message, ...rest }) => {
    if (Object.keys(rest).length) {
      console.log(`${type}: ${message || ""}`, rest); // eslint-disable-line no-console
    } else {
      console.log(`${type}: ${message || ""}`); // eslint-disable-line no-console
    }
  });
}

if (Config.DEBUG_SOCKET) {
  logs.subscribe(e => {
    console.log(e); // eslint-disable-line no-console
  });
}

if (Config.BLE_LOG_LEVEL) BluetoothTransport.setLogLevel(Config.BLE_LOG_LEVEL);

setNetwork(network);
setEnv("FORCE_PROVIDER", Config.FORCE_PROVIDER);

// Add support of HID (experimental until we stabilize it)

registerTransportModule({
  id: "hid",

  // prettier-ignore
  open: id => { // eslint-disable-line consistent-return
    if (id.startsWith("usb|")) {
      const devicePath = JSON.parse(id.slice(4));
      return retry(() => HIDTransport.open(devicePath), { maxRetry: 2 });
    }
  },

  disconnect: id =>
    id.startsWith("usb|")
      ? Promise.resolve() // nothing to do
      : null,
  discovery: Observable.create(o => HIDTransport.listen(o)).pipe(
    map(({ type, descriptor, deviceModel }) => {
      const name = deviceModel.productName;
      return {
        type,
        deviceModel,
        id: `usb|${JSON.stringify(descriptor)}`,
        name,
      };
    }),
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
if (__DEV__ && Config.DEVICE_PROXY_URL) {
  DebugHttpProxy = withStaticURLs(Config.DEVICE_PROXY_URL.split("|"));
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
  open: id => BluetoothTransport.open(id),
  disconnect: id => BluetoothTransport.disconnect(id),
});
