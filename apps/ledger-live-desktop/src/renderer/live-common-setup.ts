import "~/live-common-setup-base";
import "~/live-common-set-supported-currencies";
import "./generated/live-common-setup";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { listen as listenLogs } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";
import logger from "./logger";
listenLogs(({ id, date, ...log }) => {
  if (log.type === "hid-frame") return;
  logger.debug(log);
});
setEnvOnAllThreads("USER_ID", getUserId());

// This defines our IPC Transport that will proxy to an internal process (we shouldn't use node-hid on renderer)
registerTransportModule({
  id: "ipc",
  open: id => retry(() => IPCTransport.open(id)),
  disconnect: () => Promise.resolve(),
});
