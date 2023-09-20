import "~/live-common-setup-base";
import "~/live-common-set-supported-currencies";
import "./families"; // families may set up their own things

import VaultTransport from "@ledgerhq/hw-transport-vault";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { listen as listenLogs } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";
import logger from "./logger";
import { currentMode, setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { ipcRenderer } from "electron";

listenLogs(({ id, date, ...log }) => {
  // console.log(`🐬 listenLogs: ${JSON.stringify(log)}`);
  if (log.type === "hid-frame") return;

  logger.debug(log);
});

ipcRenderer.on("log:internal", event => {
  console.log(`👽 LOG from internal: ${JSON.stringify(event)}`);
});

setEnvOnAllThreads("USER_ID", getUserId());

const originalDeviceMode = currentMode;
const vaultTransportPrefixID = "vault-transport:";

// This defines our IPC Transport that will proxy to an internal process (we shouldn't use node-hid on renderer)
registerTransportModule({
  id: "ipc",
  open: (id: string) => {
    // id could be another type of transport such as vault-transport
    if (id.startsWith(vaultTransportPrefixID)) return;

    if (originalDeviceMode !== currentMode) {
      setDeviceMode(originalDeviceMode);
    }
    return retry(() => IPCTransport.open(id));
  },
  disconnect: () => Promise.resolve(),
});

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
