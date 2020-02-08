// @flow

export * from "./live-common-setup-base";

import React from "react";
import { connect } from "react-redux";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Observable } from "rxjs";
import { map, first, switchMap } from "rxjs/operators";
import createTransportHttp from "@ledgerhq/hw-transport-http";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import {
  registerTransportModule,
  disconnect
} from "@ledgerhq/live-common/lib/hw";
import { retry } from "@ledgerhq/live-common/lib/promise";
import { checkLibs } from "@ledgerhq/live-common/lib/sanityChecks";

checkLibs({
  NotEnoughBalance,
  React,
  log,
  Transport,
  connect
});

import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/nodejs";
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

const { SPECULOS_APDU_PORT, SPECULOS_BUTTON_PORT, SPECULOS_HOST } = process.env;
if (SPECULOS_APDU_PORT) {
  const req: Object = {
    apduPort: parseInt(SPECULOS_APDU_PORT, 10)
  };
  if (SPECULOS_BUTTON_PORT) {
    req.buttonPort = parseInt(SPECULOS_BUTTON_PORT, 10);
  }
  if (SPECULOS_HOST) {
    req.host = SPECULOS_HOST;
  }
  registerTransportModule({
    id: "tcp",
    open: () =>
      retry(() => SpeculosTransport.open(req), {
        context: "open-tcp-speculos"
      }),
    disconnect: () => Promise.resolve()
  });
}

const cacheBle = {};

if (!process.env.CI) {
  let TransportNodeBle;
  const getTransport = () => {
    if (!TransportNodeBle) {
      TransportNodeBle = require("@ledgerhq/hw-transport-node-ble").default;
    }
    return TransportNodeBle;
  };

  const openBleByQuery = async query => {
    const m = query.match(/^ble:?(.*)/);
    if (!m) throw new Error("ble regexp should match");
    const [, q] = m;
    if (cacheBle[query]) return cacheBle[query];
    const t = await (!q
      ? getTransport().create()
      : Observable.create(getTransport().listen)
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
    discovery: Observable.create(o => {
      const s = getTransport().listen(o);
      return () => s.unsubscribe();
    }).pipe(
      map(e => ({
        type: e.type,
        id: "ble:" + e.device.id,
        name: e.device.name || ""
      }))
    ),
    disconnect: query =>
      query.startsWith("ble")
        ? cacheBle[query]
          ? getTransport().disconnect(cacheBle[query].id)
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
