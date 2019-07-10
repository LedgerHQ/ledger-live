// @flow
/* eslint-disable no-console */
import winston from "winston";
import axios from "axios";
import WebSocket from "ws";
import { Observable } from "rxjs";
import { setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import {
  setNetwork,
  setWebSocketImplementation
} from "@ledgerhq/live-common/lib/network";
import { listen } from "@ledgerhq/logs";
import createTransportHttp from "@ledgerhq/hw-transport-http";
import {
  registerTransportModule,
  disconnect
} from "@ledgerhq/live-common/lib/hw";
import { retry } from "@ledgerhq/live-common/lib/promise";
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/nodejs";
import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";
import { first, switchMap, map } from "rxjs/operators";

for (const k in process.env) setEnvUnsafe(k, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;

const logger = winston.createLogger({
  level: "debug",
  transports: []
});

const winstonFormat = winston.format.simple();

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormat,
      filename: VERBOSE_FILE,
      level: "debug"
    })
  );
}

logger.add(
  new winston.transports.Console({
    format: winstonFormat,
    silent: !VERBOSE
  })
);

// eslint-disable-next-line no-unused-vars
listen(({ id, date, type, message, ...rest }) => {
  logger.log("debug", {
    message: type + (message ? ": " + message : ""),
    ...rest
  });
});

setNetwork(axios);

setWebSocketImplementation(WebSocket);

implementLibcore({
  lib: () => require("@ledgerhq/ledger-core"), // eslint-disable-line global-require
  dbPath: process.env.LIBCORE_DB_PATH || "./dbdata"
});

if (process.env.DEVICE_PROXY_URL) {
  const Tr = createTransportHttp(process.env.DEVICE_PROXY_URL.split("|"));
  registerTransportModule({
    id: "http",
    open: () =>
      retry(() => Tr.create(3000, 5000), { context: "open-http-proxy" }),
    disconnect: () => Promise.resolve()
  });
}

const cacheBle = {};

if (!process.env.CI) {
  const {
    default: TransportNodeBle
    // eslint-disable-next-line global-require
  } = require("@ledgerhq/hw-transport-node-ble");
  const openBleByQuery = async query => {
    const [, q] = query.match(/^ble:?(.*)/);
    if (cacheBle[query]) return cacheBle[query];
    const t = await (!q
      ? TransportNodeBle.create()
      : Observable.create(TransportNodeBle.listen)
          .pipe(
            first(
              e =>
                (e.device.name || "").toLowerCase().includes(q.toLowerCase()) ||
                e.device.id.toLowerCase() === q.toLowerCase()
            ),
            switchMap(e => TransportNodeBle.open(e.descriptor))
          )
          .toPromise());
    cacheBle[query] = t;
    t.on("disconnect", () => {
      delete cacheBle[query];
    });
    return t;
  };
  registerTransportModule({
    id: "ble",
    open: query => {
      if (query.startsWith("ble")) {
        return openBleByQuery(query);
      }
    },
    discovery: Observable.create(TransportNodeBle.listen).pipe(
      map(e => ({
        type: e.type,
        id: "ble:" + e.device.id,
        name: e.device.name || ""
      }))
    ),
    disconnect: query =>
      query.startsWith("ble")
        ? cacheBle[query]
          ? TransportNodeBle.disconnect(cacheBle[query].id)
          : Promise.resolve()
        : null
  });

  const {
    default: TransportNodeHid
    // eslint-disable-next-line global-require
  } = require("@ledgerhq/hw-transport-node-hid");
  registerTransportModule({
    id: "hid",
    open: devicePath =>
      // $FlowFixMe
      retry(() => TransportNodeHid.open(devicePath), {
        context: "open-hid"
      }),
    discovery: Observable.create(TransportNodeHid.listen).pipe(
      map(e => ({
        type: e.type,
        id: e.device.path,
        name: e.device.deviceName || ""
      }))
    ),
    disconnect: () => Promise.resolve()
  });
}

export function closeAllDevices() {
  Object.keys(cacheBle).forEach(disconnect);
}
