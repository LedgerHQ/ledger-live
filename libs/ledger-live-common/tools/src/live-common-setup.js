// @flow
import { Observable } from "rxjs";
import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { map } from "rxjs/operators";
import { listen } from "@ledgerhq/logs";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { setEnv, getEnv } from "@ledgerhq/live-common/lib/env";

listen(({ id: _id, date: _date, type, message, ...rest }) => {
  Object.keys(rest).length === 0
    ? // eslint-disable-next-line no-console
      console.log(type + (message ? ": " + message : ""))
    : // eslint-disable-next-line no-console
      console.log(type + (message ? ": " + message : ""), rest);
});

// setEnv("FORCE_PROVIDER", 4);

window.setEnv = setEnv;
window.getEnv = getEnv;

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "ripple",
  "bitcoin_cash",
  "litecoin",
  "dash",
  "ethereum_classic",
  "qtum",
  "zcash",
  "bitcoin_gold",
  "stratis",
  "dogecoin",
  "digibyte",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "stealthcoin",
  "decred",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "tron",
  "stellar",
  "filecoin",
]);

const webusbDevices = {};

// Still a big WIP. not sure how this should work in web paradigm...
// 'discover' is not practical paradigm, needs to fit the requestDevice paradigm!

registerTransportModule({
  id: "webhid",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webhid")) {
      return TransportWebHID.create();
    }
    return null;
  },

  disconnect: (id) =>
    id.startsWith("webhid")
      ? Promise.resolve() // nothing to do
      : null,
});

registerTransportModule({
  id: "webusb",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webusb")) {
      const existingDevice = webusbDevices[id];
      return existingDevice
        ? TransportWebUSB.open(existingDevice)
        : typeof TransportWebUSB.create();
    }
    return null;
  },

  disconnect: (id) =>
    id.startsWith("webusb")
      ? Promise.resolve() // nothing to do
      : null,

  discovery: Observable.create(TransportWebUSB.listen).pipe(
    map((usbDevice) => {
      const id = "webusb|" + usbDevice.vendorId + "_" + usbDevice.productId;
      webusbDevices[id] = usbDevice;
      return {
        type: "add",
        id,
        name: usbDevice.productName,
      };
    })
  ),
});

const webbleDevices = {};

registerTransportModule({
  id: "webble",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webble")) {
      const existingDevice = webbleDevices[id];
      return existingDevice
        ? TransportWebBLE.open(existingDevice)
        : typeof TransportWebBLE.create();
    }
    return null;
  },

  disconnect: (id) =>
    id.startsWith("webble")
      ? Promise.resolve() // nothing to do
      : null,

  discovery: Observable.create(TransportWebUSB.listen).pipe(
    map((bleDevice) => {
      const id = "webble|" + bleDevice.id;
      webbleDevices[id] = bleDevice;
      return {
        type: "add",
        id,
        name: bleDevice.name,
      };
    })
  ),
});
