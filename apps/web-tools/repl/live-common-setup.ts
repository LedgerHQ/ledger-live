import {
  deserializeError,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import Transport, { DescriptorEvent, Observer } from "@ledgerhq/hw-transport";
import withStaticURL from "@ledgerhq/hw-transport-http";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";

const webusbDevices: Record<string, USBDevice> = {};

registerTransportModule({
  id: "webhid",

  open: id => {
    if (id.startsWith("webhid")) {
      return TransportWebHID.create();
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webhid")
      ? Promise.resolve() // nothing to do
      : null,
});

registerTransportModule({
  id: "webusb",

  open: id => {
    if (id.startsWith("webusb")) {
      const existingDevice = webusbDevices[id];
      return existingDevice ? TransportWebUSB.open(existingDevice) : TransportWebUSB.create();
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webusb")
      ? Promise.resolve() // nothing to do
      : null,
});

const webbleDevices: Record<string, unknown> = {};

registerTransportModule({
  id: "webble",

  open: id => {
    if (id.startsWith("webble")) {
      const existingDevice = webbleDevices[id];
      return existingDevice ? TransportWebBLE.open(existingDevice) : TransportWebBLE.create();
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webble")
      ? Promise.resolve() // nothing to do
      : null,
});

let proxy: Transport | undefined;
registerTransportModule({
  id: "proxy",

  open: id => {
    if (id.startsWith("proxy")) {
      const urls = id.slice(6) || "ws://localhost:8435";
      const Tr = withStaticURL(urls);
      return Tr.create().then(t => {
        proxy = t;
        return t;
      });
    }
    return null;
  },

  disconnect: id => (id.startsWith("proxy") ? proxy && proxy.close() : null),
});

const { ledgerHidTransport } = global as { ledgerHidTransport?: any };
if (ledgerHidTransport) {
  const cmd = async (...args: unknown[]) => {
    try {
      const res = await ledgerHidTransport(...args);
      return res;
    } catch (e) {
      throw deserializeError(e);
    }
  };

  class HIDProxy extends Transport {
    static isSupported = () => Promise.resolve(true);
    static list = () => Promise.resolve([null]);
    static listen = (o: Observer<DescriptorEvent<null>>) => {
      let unsubscribed: boolean = false;
      setTimeout(() => {
        if (unsubscribed) return;
        o.next({ type: "add", descriptor: null });
        o.complete();
      }, 0);
      return {
        unsubscribe: () => {
          unsubscribed = true;
        },
      };
    };

    static open = async () => {
      await cmd("open");
      return new HIDProxy();
    };

    setScrambleKey() {}

    close() {
      return cmd("close");
    }

    async exchange(apdu: Buffer): Promise<Buffer> {
      const inputHex = apdu.toString("hex");
      try {
        const outputHex = await cmd("exchange", inputHex);
        return Buffer.from(outputHex, "hex");
      } catch (e) {
        if (e instanceof DisconnectedDeviceDuringOperation || e instanceof DisconnectedDevice) {
          this.emit("disconnect", e);
        }
        throw e;
      }
    }
  }

  registerTransportModule({
    id: "hid",

    open: id => {
      if (id.startsWith("hid")) {
        return HIDProxy.open();
      }
      return null;
    },

    disconnect: id => (id.startsWith("hid") ? cmd("close") : null),
  });
}
