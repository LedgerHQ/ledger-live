// @flow
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import axios from "axios";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { setEnv } from "@ledgerhq/live-common/lib/env";

import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";

setEnv("FORCE_PROVIDER", 4);

setNetwork(axios);

const webusbDevices = {};

// Still a big WIP. not sure how this should work in web paradigm...
// 'discover' is not practical paradigm, needs to fit the requestDevice paradigm!

registerTransportModule({
  id: "webusb",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webusb")) {
      const existingDevice = webusbDevices[id];
      return (existingDevice
        ? TransportWebUSB.open(existingDevice)
        : TransportWebUSB.create()
      ).then(t => {
        // fallback on create() in case discovery not used (we later should backport this in open?)
        t.setDebugMode(true);
        return t;
      });
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webusb")
      ? Promise.resolve() // nothing to do
      : null,

  discovery: Observable.create(TransportWebUSB.listen).pipe(
    map(usbDevice => {
      const id = "webusb|" + usbDevice.vendorId + "_" + usbDevice.productId;
      webusbDevices[id] = usbDevice;
      return {
        type: "add",
        id,
        name: usbDevice.productName
      };
    })
  )
});

const webbleDevices = {};

registerTransportModule({
  id: "webble",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webble")) {
      const existingDevice = webbleDevices[id];
      return (existingDevice
        ? TransportWebBLE.open(existingDevice)
        : TransportWebBLE.create()
      ).then(t => {
        // fallback on create() in case discovery not used (we later should backport this in open?)
        t.setDebugMode(true);
        return t;
      });
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webble")
      ? Promise.resolve() // nothing to do
      : null,

  discovery: Observable.create(TransportWebUSB.listen).pipe(
    map(bleDevice => {
      const id = "webble|" + bleDevice.id;
      webbleDevices[id] = bleDevice;
      return {
        type: "add",
        id,
        name: bleDevice.name
      };
    })
  )
});
