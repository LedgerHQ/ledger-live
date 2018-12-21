// @flow
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import axios from "axios";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { setEnv } from "@ledgerhq/live-common/lib/env";

setEnv("FORCE_PROVIDER", 4);

setNetwork(axios);

const webusbDevices = {};

// Still a big WIP. not sure how this should work in web paradigm...
// 'discover' is not practical paradigm, needs to fit the requestDevice paradigm!

registerTransportModule({
  id: "webusb",

  open: async (id: string): ?Promise<*> => {
    if (id.startsWith("webusb")) {
      const existingDevice = webusbDevices[id];
      const t = await (existingDevice
        ? TransportWebUSB.open(existingDevice)
        : TransportWebUSB.create()); // fallback on create() in case discovery not used (we later should backport this in open?)
      t.setDebugMode(true);
      return t;
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

  open: async (id: string): ?Promise<*> => {
    if (id.startsWith("webble")) {
      const existingDevice = webbleDevices[id];
      const t = await (existingDevice
        ? TransportWebBLE.open(existingDevice)
        : TransportWebBLE.create()); // fallback on create() in case discovery not used (we later should backport this in open?)
      t.setDebugMode(true);
      return t;
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
