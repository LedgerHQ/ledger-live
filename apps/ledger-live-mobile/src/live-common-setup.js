// @flow
import Config from "react-native-config";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { listen } from "@ledgerhq/logs";
import HIDTransport from "@ledgerhq/react-native-hid";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { retry } from "@ledgerhq/live-common/lib/promise";
import { setEnv } from "@ledgerhq/live-common/lib/env";
import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { setPlatformVersion } from "@ledgerhq/live-common/lib/platform/version";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import { setDeviceMode } from "@ledgerhq/live-common/lib/hw/actions/app";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import axios from "axios";
import { setSecp256k1Instance } from "@ledgerhq/live-common/lib/families/bitcoin/wallet-btc/crypto/secp256k1";
import { setGlobalOnBridgeError } from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import BluetoothTransport from "./react-native-hw-transport-ble";
import "./experimental";
import logger from "./logger";

setGlobalOnBridgeError(e => logger.critical(e));

setDeviceMode("polling");

setPlatformVersion("0.0.1");

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "polkadot",
  "solana",
  "ripple",
  "litecoin",
  "polygon",
  "bitcoin_cash",
  "stellar",
  "dogecoin",
  "cosmos",
  "crypto_org",
  "celo",
  "dash",
  "tron",
  "tezos",
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "cosmos_testnet",
  "elrond",
  "cardano",
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

if (Config.BLE_LOG_LEVEL) BluetoothTransport.setLogLevel(Config.BLE_LOG_LEVEL);

if (Config.FORCE_PROVIDER) setEnv("FORCE_PROVIDER", Config.FORCE_PROVIDER);

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

if (process.env.NODE_ENV === "production") {
  axios.defaults.headers.common["User-Agent"] =
    Platform.OS === "ios"
      ? `Live-IOS/${VersionNumber.appVersion}`
      : `Live-Android/${VersionNumber.appVersion}`;
}

setSecp256k1Instance(require("./logic/secp256k1"));
