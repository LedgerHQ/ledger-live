// @flow
import "../live-common-setup";
import { setBridgeProxy } from "@ledgerhq/live-common/bridge/index";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { getUserId } from "~/helpers/user";
import { getAccountBridge, getCurrencyBridge } from "./bridge/proxy";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";

setEnvOnAllThreads("USER_ID", getUserId());

setBridgeProxy({ getAccountBridge, getCurrencyBridge });

registerTransportModule({
  id: "ipc",
  open: id => {
    // Should we return the transport if already open or return an error ?
    return retry(() => IPCTransport.open(id));
  },
  disconnect: () => {
    return Promise.resolve();
  },
});
