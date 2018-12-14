// @flow
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import axios from "axios";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { setEnv } from "@ledgerhq/live-common/lib/env";

setEnv("FORCE_PROVIDER", 4);

setNetwork(axios);

registerTransportModule({
  id: "webusb",
  open: id => {
    if (id.startsWith("webusb")) {
      return TransportWebUSB.create();
    }
    return null;
  },
  disconnect: id =>
    id.startsWith("webusb")
      ? Promise.resolve() // nothing to do
      : null
});

registerTransportModule({
  id: "webble",
  open: id => {
    if (id.startsWith("webble")) {
      return TransportWebBLE.create();
    }
    return null;
  },
  disconnect: id =>
    id.startsWith("webble")
      ? Promise.resolve() // nothing to do
      : null
});
