export * from "./live-common-setup-base";
import React from "react";
import invariant from "invariant";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Observable } from "rxjs";
import { map, first, switchMap } from "rxjs/operators";
import createTransportHttp from "@ledgerhq/hw-transport-http";
import SpeculosTransport, {
  SpeculosTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos";
import {
  registerTransportModule,
  disconnect,
} from "@ledgerhq/live-common/lib/hw";
import { retry } from "@ledgerhq/live-common/lib/promise";
import { checkLibs } from "@ledgerhq/live-common/lib/sanityChecks";
import { closeAllSpeculosDevices } from "@ledgerhq/live-common/lib/load/speculos";
import { disconnectAll } from "@ledgerhq/live-common/lib/api";

checkLibs({
  NotEnoughBalance,
  React,
  log,
  Transport,
});

type BluetoothTransport = any;

let idCounter = 0;
const mockTransports = {};
const recordStores = {};

export function releaseMockDevice(id: string) {
  const store = recordStores[id];
  invariant(store, "MockDevice does not exist (%s)", id);
  try {
    store.ensureQueueEmpty();
  } finally {
    delete recordStores[id];
    delete mockTransports[id];
  }
}

export async function mockDeviceWithAPDUs(apdus: string) {
  const id = `mock:${++idCounter}`;
  const store = RecordStore.fromString(apdus);
  recordStores[id] = store;
  mockTransports[id] = await openTransportReplayer(store);
  return id;
}

registerTransportModule({
  id: "mock",
  open: (id) => {
    if (id in mockTransports) {
      const Tr = mockTransports[id];
      return Tr;
    }
  },
  disconnect: () => Promise.resolve(),
});

if (process.env.DEVICE_PROXY_URL) {
  const Tr = createTransportHttp(process.env.DEVICE_PROXY_URL.split("|"));
  registerTransportModule({
    id: "http",
    open: () =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      retry(() => Tr.create(3000, 5000), {
        context: "open-http-proxy",
      }),
    disconnect: () => Promise.resolve(),
  });
}

const { SPECULOS_APDU_PORT, SPECULOS_BUTTON_PORT, SPECULOS_HOST } = process.env;

if (SPECULOS_APDU_PORT) {
  const req: Record<string, any> = {
    apduPort: parseInt(SPECULOS_APDU_PORT, 10),
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
      retry(() => SpeculosTransport.open(req as SpeculosTransportOpts), {
        context: "open-tcp-speculos",
      }),
    disconnect: () => Promise.resolve(),
  });
}

const cacheBle = {};

async function init() {
  let TransportNodeBle;

  const getTransport = async (): Promise<BluetoothTransport> => {
    if (!TransportNodeBle) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { default: mod } = await import("@ledgerhq/hw-transport-node-ble");
      TransportNodeBle = mod;
    }

    return TransportNodeBle as BluetoothTransport;
  };

  const openBleByQuery = async (query) => {
    const m = query.match(/^ble:?(.*)/);
    if (!m) throw new Error("ble regexp should match");
    const [, q] = m;
    if (cacheBle[query]) return cacheBle[query];
    const t = await (!q
      ? ((await getTransport().constructor) as typeof TransportNodeBle).create()
      : new Observable(
          ((await getTransport().constructor) as typeof TransportNodeBle).listen
        )
          .pipe(
            first(
              (e: any) =>
                (e.device.name || "").toLowerCase().includes(q.toLowerCase()) ||
                e.device.id.toLowerCase() === q.toLowerCase()
            ),
            switchMap((e) => TransportNodeBle.open(e.descriptor))
          )
          .toPromise());
    cacheBle[query] = t;
    (t as Transport).on("disconnect", () => {
      delete cacheBle[query];
    });
    return t;
  };

  registerTransportModule({
    id: "ble",
    open: (query) => {
      if (query.startsWith("ble")) {
        return openBleByQuery(query);
      }
    },
    discovery: new Observable((o) => {
      let s: any;

      getTransport().then((module) => {
        (module.constructor as typeof TransportNodeBle).listen(o);
        s = module;
      });

      return () => s && s.unsubscribe();
    }).pipe(
      map((e: any) => ({
        type: e.type,
        id: "ble:" + e.device.id,
        name: e.device.name || "",
      }))
    ),
    disconnect: async (query) =>
      query.startsWith("ble")
        ? cacheBle[query]
          ? (
              (await getTransport().constructor) as typeof TransportNodeBle
            ).disconnect(cacheBle[query].id)
          : Promise.resolve()
        : undefined,
  });

  const {
    default: TransportNodeHid,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require("@ledgerhq/hw-transport-node-hid");

  registerTransportModule({
    id: "hid",
    open: (devicePath) =>
      retry(() => TransportNodeHid.open(devicePath), {
        context: "open-hid",
      }),
    discovery: new Observable(TransportNodeHid.listen).pipe(
      map((e: any) => ({
        type: e.type,
        id: e.device.path,
        name: e.device.deviceName || "",
      }))
    ),
    disconnect: () => Promise.resolve(),
  });
}

if (!process.env.CI) {
  init();
}

export function closeAllDevices() {
  Object.keys(cacheBle).forEach(disconnect);
  closeAllSpeculosDevices();
  disconnectAll();
}
