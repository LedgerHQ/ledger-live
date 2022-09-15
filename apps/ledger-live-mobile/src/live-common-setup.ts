import Config from "react-native-config";
import { Observable, timer } from "rxjs";
import { map, debounce } from "rxjs/operators";
import { listen } from "@ledgerhq/logs";
import HIDTransport from "@ledgerhq/react-native-hid";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { retry } from "@ledgerhq/live-common/promise";
import { setEnv } from "@ledgerhq/live-common/env";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { setPlatformVersion } from "@ledgerhq/live-common/platform/version";
import { PLATFORM_VERSION } from "@ledgerhq/live-common/platform/constants";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import type { TransportModule } from "@ledgerhq/live-common/hw/index";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { getDeviceModel } from "@ledgerhq/devices";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import VersionNumber from "react-native-version-number";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Platform } from "react-native";
import { setSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/wallet-btc/crypto/secp256k1";
import { setGlobalOnBridgeError } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { prepareCurrency } from "./bridge/cache";
import BluetoothTransport from "./react-native-hw-transport-ble";
import "./experimental";
import logger from "./logger";

setGlobalOnBridgeError(e => logger.critical(e));
setDeviceMode("polling");
setPlatformVersion(PLATFORM_VERSION);
setWalletAPIVersion(WALLET_API_VERSION);
setSupportedCurrencies([
  "avalanche_c_chain",
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
  "crypto_org_croeseid",
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
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "elrond",
  "hedera",
  "cardano",
  "osmosis",
  "filecoin",
  "fantom",
  "cronos",
  "moonbeam",
  "songbird",
  "flare",
  "near",
  "stacks",
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
  // eslint-disable-next-line consistent-return
  open: id => {
    if (id.startsWith("usb|")) {
      const devicePath = JSON.parse(id.slice(4));
      return retry(() => HIDTransport.open(devicePath), {
        maxRetry: 2
      });
    }
  },
  disconnect: id =>
    id.startsWith("usb|")
      ? Promise.resolve() // nothing to do
      : null,
  discovery: new Observable<DescriptorEvent<string>>(o =>
    HIDTransport.listen(o),
  ).pipe(
    map(({ type, descriptor, deviceModel }) => {
      const name = deviceModel?.productName ?? "";
      return {
        type,
        id: `usb|${JSON.stringify(descriptor)}`,
        deviceModel,
        wired: true,
        name,
      };
    }),
    debounce(e => timer(e.type === "remove" ? 2000 : 0)),
  ),
});
// Add dev mode support of an http proxy
let DebugHttpProxy: ReturnType<typeof withStaticURLs>;
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
  httpdebug.discovery = new Observable<DescriptorEvent<string>>(o =>
    DebugHttpProxy.listen(o),
  ).pipe(
    map(({ type, descriptor }) => ({
      type,
      id: `httpdebug|${descriptor}`,
      deviceModel: getDeviceModel(
        (Config?.FALLBACK_DEVICE_MODEL_ID as DeviceModelId) || "nanoX",
      ),
      wired: Config?.FALLBACK_DEVICE_WIRED === "YES",
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
  const value =
    Platform.OS === "ios"
      ? `llm-ios/${VersionNumber.appVersion}`
      : `llm-android/${VersionNumber.appVersion}`;
  setEnv("LEDGER_CLIENT_VERSION", value);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
setSecp256k1Instance(require("./logic/secp256k1"));

prepareCurrency(getCryptoCurrencyById("ethereum"));
