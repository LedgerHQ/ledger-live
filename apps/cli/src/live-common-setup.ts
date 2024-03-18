export * from "./live-common-setup-base";
import React from "react";
import invariant from "invariant";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Transport from "@ledgerhq/hw-transport";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import createTransportHttp from "@ledgerhq/hw-transport-http";
import SpeculosTransport, { SpeculosTransportOpts } from "@ledgerhq/hw-transport-node-speculos";
import { registerTransportModule, disconnect } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import { closeAllSpeculosDevices } from "@ledgerhq/live-common/load/speculos";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";

checkLibs({
  NotEnoughBalance,
  React,
  log,
  Transport,
});

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
  open: id => {
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
  const {
    default: TransportNodeHid,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require("@ledgerhq/hw-transport-node-hid");

  registerTransportModule({
    id: "hid",
    open: devicePath =>
      retry(() => TransportNodeHid.open(devicePath), {
        context: "open-hid",
      }),
    discovery: new Observable(TransportNodeHid.listen).pipe(
      map((e: any) => ({
        type: e.type,
        id: e.device.path,
        name: e.device.deviceName || "",
      })),
    ),
    disconnect: () => Promise.resolve(),
  });
}

LiveConfig.setConfig(liveConfig);

if (!process.env.CI) {
  init();
}

export function closeAllDevices() {
  Object.keys(cacheBle).forEach(disconnect);
  closeAllSpeculosDevices();
}
