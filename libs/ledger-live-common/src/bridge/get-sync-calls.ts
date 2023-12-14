"use strict";
import allSpecs from "../generated/specs";
import { Account } from "@ledgerhq/types-live";
import { AppCandidate, AppSpec } from "@ledgerhq/coin-framework/bot/types";
import {
  createSpeculosDevice,
  findAppCandidate,
  listAppCandidates,
  releaseSpeculosDevice,
} from "../load/speculos";
import { makeBridgeCacheSystem } from "../bridge/cache";
import { getCurrencyBridge } from "../bridge";
import { filter, map, reduce, timeout } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-env";
import { firstValueFrom, throwError } from "rxjs";
import { PerformanceObserver, PerformanceObserverCallback } from "node:perf_hooks";
import { mockDeviceWithAPDUs, releaseMockDevice } from "../__tests__/test-helpers/mockDevice";
const { createHash } = require("crypto");
import dataset from "../families/cosmos/datasets/cosmos";
import fs from "fs";

const requests: any = [];

type StdRequest = {
  method: string;
  url: string;
  headers: any;
  fileName: string;
  body: any;
};

const onPerformanceEntry: PerformanceObserverCallback = (items, _observer) => {
  const entries = items.getEntries();
  for (const entry of entries) {
    if (entry.entryType === "http") {
      const req = (entry as any).detail?.req;
      const res = (entry as any).detail?.res;
      if (res && req) {
        if (req.url !== "http://localhost/apdu") {
          requests.push(reqToStdRequest(req));
        }
      }
    }
  }
};

function reqToStdRequest(nodeRequest: any): StdRequest {
  return {
    method: nodeRequest.method,
    url: nodeRequest.url,
    headers: nodeRequest.headers,
    body: nodeRequest.body || {},
    fileName: sha256(`${nodeRequest.method}${nodeRequest.url}`),
  };
}

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

async function executeSync(): Promise<void> {
  // const [family, key] = process.argv.slice(2);
  const useSpeculos = true;

  let device;
  let currency;

  if (useSpeculos) {
    const { COINAPPS, SEED } = process.env;
    if (!COINAPPS) {
      throw new Error("COINAPPS env variable is required");
    }
    if (!SEED) {
      throw new Error("SEED env variable is required");
    }
    // Prepare speculos device simulator
    const spec: AppSpec<any> = allSpecs["bitcoin"]["bitcoin"];
    const appCandidates = await listAppCandidates(COINAPPS);
    const { appQuery, dependency, onSpeculosDeviceCreated } = spec;
    currency = spec.currency;
    const appCandidate = findAppCandidate(appCandidates, appQuery);
    if (!appCandidate) {
      console.warn("no app found for " + spec.name);
      console.warn(appQuery);
      console.warn(JSON.stringify(appCandidates, undefined, 2));
    }

    if (!appCandidate) {
      throw new Error(`no app found for ${spec.name}. Are you sure your COINAPPS is up to date?`);
    }

    const deviceParams = {
      ...(appCandidate as AppCandidate),
      appName: spec.currency.managerAppName,
      seed: SEED,
      dependency,
      coinapps: COINAPPS,
      onSpeculosDeviceCreated,
    };
    device = await createSpeculosDevice(deviceParams);
  } else {
    if (dataset.scanAccounts && dataset.scanAccounts[0]) {
      console.log("before test");
      device = {
        id: await mockDeviceWithAPDUs(dataset.scanAccounts[0].apdus, { autoSkipUnknownApdu: true }),
      };
      console.log("test");
    } else {
      throw new Error("No apdus");
    }
  }

  try {
    const performanceObserver = new PerformanceObserver(onPerformanceEntry);
    performanceObserver.observe({ type: "http" });

    // We scan and synchronize the accounts
    const localCache = {};

    const cache = makeBridgeCacheSystem({
      saveData(c, d) {
        localCache[c.id] = d;
        performanceObserver;
        return Promise.resolve();
      },

      getData(c) {
        return Promise.resolve(localCache[c.id]);
      },
    });

    const bridge = getCurrencyBridge(currency);
    const syncConfig = {
      paginationConfig: {},
    };

    await cache.prepareCurrency(currency);
    const accounts = await firstValueFrom(
      bridge
        .scanAccounts({
          currency,
          deviceId: device.id,
          syncConfig,
        })
        .pipe(
          filter(e => e.type === "discovered"),
          map(e => e.account),
          reduce<Account, Account[]>((all, a) => all.concat(a), []),
          timeout({
            each: getEnv("BOT_TIMEOUT_SCAN_ACCOUNTS"),
            with: () =>
              throwError(() => new Error("scan accounts timeout for currency " + currency.name)),
          }),
        ),
    );

    performanceObserver.disconnect();
  } finally {
    if (useSpeculos) {
      await releaseSpeculosDevice(device.id);
    } else {
      releaseMockDevice(device.id);
    }
    console.log(requests);
  }
}

executeSync().then(
  r => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(r));
    fs.writeFileSync("./output.json", JSON.stringify({ requests }));
    process.exit(0);
  },
  error => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ error: String(error) }));
    process.exit(0);
  },
);
