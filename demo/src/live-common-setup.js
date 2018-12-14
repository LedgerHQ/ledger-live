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
  open: async (id: string): ?Promise<*> => {
    if (id.startsWith("webusb")) {
      // TODO this should not call create() because listen() must be not done each time.
      const t = await TransportWebUSB.create();
      t.setDebugMode(true);
      return t;
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
  open: async (id: string): ?Promise<*> => {
    if (id.startsWith("webble")) {
      // TODO this should not call create() because listen() must be not done each time.
      const t = await TransportWebBLE.create();
      t.setDebugMode(true);
      return t;
    }
    return null;
  },
  disconnect: id =>
    id.startsWith("webble")
      ? Promise.resolve() // nothing to do
      : null
});
