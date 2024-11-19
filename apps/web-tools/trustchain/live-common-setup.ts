import "../live-common-setup-network";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import withStaticURL from "@ledgerhq/hw-transport-http";
import { listen } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";

listen(log => {
  console.log(log.type + ": " + log.message);
});

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
