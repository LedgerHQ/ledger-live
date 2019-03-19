// @flow
import axios from "axios";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { retry } from "@ledgerhq/live-common/lib/promise";

setNetwork(axios);

registerTransportModule({
  id: "hid",
  open: devicePath =>
    // $FlowFixMe
    retry(() => TransportNodeHid.open(devicePath), {
      maxRetry: 2
    }),
  disconnect: () => Promise.resolve()
});
