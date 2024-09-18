import "~/live-common-set-supported-currencies";
import "~/live-common-setup-base";
import "./families"; // families may set up their own things

import TransportHttp from "@ledgerhq/hw-transport-http";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";
import VaultTransport from "@ledgerhq/hw-transport-vault";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { getEnv } from "@ledgerhq/live-env";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import logger from "./logger";

setEnvOnAllThreads("USER_ID", getUserId());

const vaultTransportPrefixID = "vault-transport:";

// Listens to logs from `@ledgerhq/logs` (happening on the renderer process) and transfers them to the LLD logger system
listenLogs(({ id, date, ...log }) => {
  if (log.type === "hid-frame") return;

  logger.debug(log);
});

if (getEnv("SPECULOS_API_PORT")) {
  const req: Record<string, number> = {
    apiPort: getEnv("SPECULOS_API_PORT"),
  };

  registerTransportModule({
    id: "speculos-http",
    open: () => retry(() => SpeculosHttpTransport.open(req as SpeculosHttpTransportOpts)),
    disconnect: () => Promise.resolve(),
  });
} else if (getEnv("DEVICE_PROXY_URL")) {
  const Tr = TransportHttp(getEnv("DEVICE_PROXY_URL").split("|"));
  registerTransportModule({
    id: "proxy",
    open: () => retry(() => Tr.create(3000, 5000)),
    disconnect: () => Promise.resolve(),
  });
} else {
  registerTransportModule({
    id: "web-hid",
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "TransportWebHID",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });
      return retry(() => TransportWebHID.create(timeoutMs), { interval: 500, maxRetry: 4 });
    },
    disconnect: () => Promise.resolve(),
  });
}

registerTransportModule({
  id: "vault-transport",
  open: (id: string) => {
    if (!id.startsWith(vaultTransportPrefixID)) return;
    setDeviceMode("polling");
    const params = new URLSearchParams(id.split(vaultTransportPrefixID)[1]);
    return retry(() =>
      VaultTransport.open(params.get("host") as string).then(transport => {
        transport.setData({
          token: params.get("token") as string,
          workspace: params.get("workspace") as string,
        });
        return Promise.resolve(transport);
      }),
    );
  },
  disconnect: () => {
    return Promise.resolve();
  },
});
