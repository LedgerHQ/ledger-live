// @flow
/* eslint-disable no-console */
import axios from "axios";
import WebSocket from "ws";
import { setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import {
  setNetwork,
  setWebSocketImplementation
} from "@ledgerhq/live-common/lib/network";
import createTransportHttp from "@ledgerhq/hw-transport-http";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { retry } from "@ledgerhq/live-common/lib/promise";
import { logsObservable } from "@ledgerhq/live-common/lib/logs";
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/nodejs";
import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";

for (const k in process.env) setEnvUnsafe(k, process.env[k]);

const logger = process.env.VERBOSE
  ? (level, ...args) => console.log(level, ...args)
  : undefined;

if (logger) {
  logsObservable.subscribe(log =>
    logger("live-common:" + log.type, log.message)
  );
}

setNetwork(axios);

setWebSocketImplementation(WebSocket);

implementLibcore({
  lib: require("@ledgerhq/ledger-core"), // eslint-disable-line global-require
  dbPath: process.env.LIBCORE_DB_PATH || "./dbdata",
  logger
});

if (process.env.DEBUG_COMM_HTTP_PROXY) {
  const Tr = createTransportHttp(process.env.DEBUG_COMM_HTTP_PROXY.split("|"));
  registerTransportModule({
    id: "http",
    open: () => retry(() => Tr.create(3000, 5000)),
    disconnect: () => Promise.resolve()
  });
}

if (!process.env.CI) {
  const {
    default: TransportNodeHid
    // eslint-disable-next-line global-require
  } = require("@ledgerhq/hw-transport-node-hid");
  registerTransportModule({
    id: "hid",
    open: devicePath =>
      // $FlowFixMe
      retry(() => TransportNodeHid.open(devicePath), {
        maxRetry: 5 // YOLO
      }).then(t => {
        if (process.env.VERBOSE) t.setDebugMode(true);
        return t;
      }),
    disconnect: () => Promise.resolve()
  });
}
