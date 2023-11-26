import "~/live-common-setup-base";
import { throwError } from "rxjs";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { setErrorRemapping } from "@ledgerhq/live-common/hw/deviceAccess";
import { setEnvUnsafe, getEnv } from "@ledgerhq/live-env";
import { retry } from "@ledgerhq/live-common/promise";
import TransportNodeHidSingleton from "@ledgerhq/hw-transport-node-hid-singleton";
import TransportHttp from "@ledgerhq/hw-transport-http";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { TraceContext, listen as listenLogs } from "@ledgerhq/logs";
import { ForwardToMainLogger } from "./logger";

/* eslint-disable guard-for-in */
for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}
/* eslint-enable guard-for-in */

const forwardToMainLogger = ForwardToMainLogger.getLogger();

// Listens to logs from the internal threads, and forwards them to the main thread
listenLogs(log => {
  forwardToMainLogger.log(log);
});

setErrorRemapping(e => {
  // NB ideally we should solve it in ledgerjs
  if (e && e.message && e.message.indexOf("HID") >= 0) {
    return throwError(() => new DisconnectedDevice(e.message));
  }
  return throwError(() => e);
});
if (getEnv("DEVICE_PROXY_URL")) {
  const Tr = TransportHttp(getEnv("DEVICE_PROXY_URL").split("|"));
  registerTransportModule({
    id: "proxy",
    open: () => retry(() => Tr.create(3000, 5000)),
    disconnect: () => Promise.resolve(),
  });
} else {
  registerTransportModule({
    id: "hid",
    open: (id: string, timeoutMs?: number, context?: TraceContext) =>
      retry(() => TransportNodeHidSingleton.open(id, timeoutMs, context), {
        maxRetry: 4,
      }),
    disconnect: () => Promise.resolve(),
    setAllowAutoDisconnect: async (transport, _, allow) =>
      (transport as TransportNodeHidSingleton).setAllowAutoDisconnect(allow),
  });
}
export function unsubscribeSetup() {
  TransportNodeHidSingleton.disconnect();
}
