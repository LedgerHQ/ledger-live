"use strict";
import "../../__tests__/test-helpers/environment";
import {
  PerformanceObserver,
  PerformanceObserverCallback,
} from "node:perf_hooks";
// import path from "path";
// import fs from "fs/promises";
import allSpecs from "../../generated/specs";
import type { AppSpec } from "../types";
import { Account } from "@ledgerhq/types-live";
import {
  AppCandidate,
  createSpeculosDevice,
  findAppCandidate,
  listAppCandidates,
  releaseSpeculosDevice,
} from "../../load/speculos";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { getAccountBridge, getCurrencyBridge } from "../../bridge";
import { filter, map, reduce, timeoutWith } from "rxjs/operators";
import { getEnv } from "../../env";
import { throwError } from "rxjs";
import { AuditResult, NetworkAuditResult, Report } from "./types";
import { toAccountRaw } from "../../account";
import { promiseAllBatched } from "../../promise";

const bootTime = Date.now() - parseInt(process.env.START_TIME || "0", 10);

main().then(
  (r) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(r));
    process.exit(0);
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ error: String(error) }));
    process.exit(0);
  }
);

async function main(): Promise<Report> {
  const report: Report = {};
  const [family, key] = process.argv.slice(2);
  const spec: AppSpec<any> = allSpecs[family][key];

  const { COINAPPS, SEED } = process.env;

  if (!COINAPPS) {
    throw new Error("COINAPPS env variable is required");
  }
  if (!SEED) {
    throw new Error("SEED env variable is required");
  }

  // Prepare speculos device simulator

  const appCandidates = await listAppCandidates(COINAPPS);

  const { appQuery, currency, dependency } = spec;
  const appCandidate = findAppCandidate(appCandidates, appQuery);
  if (!appCandidate) {
    console.warn("no app found for " + spec.name);
    console.warn(appQuery);
    console.warn(JSON.stringify(appCandidates, undefined, 2));
  }
  if (!appCandidate) {
    throw new Error(
      `no app found for ${spec.name}. Are you sure your COINAPPS is up to date?`
    );
  }
  const deviceParams = {
    ...(appCandidate as AppCandidate),
    appName: spec.currency.managerAppName,
    seed: SEED,
    dependency,
    coinapps: COINAPPS,
  };

  const device = await createSpeculosDevice(deviceParams);

  try {
    const audit = new Audit(bootTime);

    // We scan and synchronize the accounts

    const localCache = {};
    const cache = makeBridgeCacheSystem({
      saveData(c, d) {
        localCache[c.id] = d;
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
    const accounts = await bridge
      .scanAccounts({
        currency,
        deviceId: device.id,
        syncConfig,
      })
      .pipe(
        filter((e) => e.type === "discovered"),
        map((e) => e.account),
        reduce<Account, Account[]>((all, a) => all.concat(a), []),
        timeoutWith(
          getEnv("BOT_TIMEOUT_SCAN_ACCOUNTS"),
          throwError(
            new Error("scan accounts timeout for currency " + currency.name)
          )
        )
      )
      .toPromise();

    audit.end();

    const syncAccount = async (account: Account) => {
      const bridge = getAccountBridge(account);
      const syncConfig = {
        paginationConfig: {},
        blacklistedTokenIds: [],
      };
      const observable = bridge.sync(account, syncConfig);
      const reduced = observable.pipe(reduce((a, f) => f(a), account));
      const synced = await reduced.toPromise();
      return synced;
    };

    const incrementalAudit = new Audit(bootTime);
    await promiseAllBatched(
      getEnv("SYNC_MAX_CONCURRENT"),
      accounts,
      syncAccount
    );
    incrementalAudit.end();

    const accountsRaw = JSON.stringify(accounts.map(toAccountRaw));
    const preloadJSON = JSON.stringify(localCache);
    audit.setAccountsJSONSize(accountsRaw.length);
    audit.setPreloadJSONSize(preloadJSON.length);

    /*
    // TODO big data
    if (REPORT_FOLDER) {
      const accountsFile = path.join(REPORT_FOLDER, "accounts.json");
      await fs.writeFile(accountsFile, accountsRaw);
    }
    */

    report.refillAddress = accounts[0]?.freshAddress;
    report.accountBalances = accounts.map((a) => a.balance.toString());
    report.accountOperationsLength = accounts.map((a) => a.operations.length);
    report.auditResult = audit.result();
    report.incrementalAuditResult = incrementalAudit.result();
  } finally {
    await releaseSpeculosDevice(device.id);
  }

  return report;
}

class SlowFrameDetector {
  _count = 0;
  _duration = 0;
  _threshold: number;
  _interval: NodeJS.Timeout | undefined;

  constructor(threshold = 200) {
    this._threshold = threshold;
  }

  start() {
    if (this._interval) {
      throw new Error("already started");
    }
    let lastFrame = Date.now();
    this._interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastFrame;
      if (diff > this._threshold) {
        this._count++;
        this._duration += diff;
      }
      lastFrame = now;
    }, 10);
  }

  stop() {
    if (!this._interval) {
      throw new Error("not started");
    }
    clearInterval(this._interval);
    this._interval = undefined;
  }

  result() {
    return {
      count: this._count,
      duration: this._duration,
    };
  }
}

// all the logic to measure and report back
class Audit {
  _jsBootTime: number;
  _startTime: [number, number];
  _startUsage: NodeJS.CpuUsage;
  _startMemory: NodeJS.MemoryUsage;
  _slowFrameDetector: SlowFrameDetector;
  _networkAudit: NetworkAudit;

  constructor(jsBootTime = 0) {
    this._jsBootTime = jsBootTime;
    this._startTime = process.hrtime();
    this._startUsage = process.cpuUsage();
    this._startMemory = process.memoryUsage();
    this._slowFrameDetector = new SlowFrameDetector();
    this._slowFrameDetector.start();
    this._networkAudit = new NetworkAudit();
    this._networkAudit.start();
  }

  _totalTime: number | undefined;
  _cpuUserTime: number | undefined;
  _cpuSystemTime: number | undefined;
  _endMemory: NodeJS.MemoryUsage | undefined;

  end() {
    const endTime = process.hrtime(this._startTime);
    const endUsage = process.cpuUsage(this._startUsage);
    const endMemory = process.memoryUsage();
    this._totalTime = (endTime[0] * 1e9 + endTime[1]) / 1e6; // ms
    this._cpuUserTime = endUsage.user / 1e3; // ms
    this._cpuSystemTime = endUsage.system / 1e3; // ms
    this._endMemory = endMemory;
    this._slowFrameDetector.stop();
    this._networkAudit.stop();
  }

  _accountsJSONSize: number | undefined;
  setAccountsJSONSize(size: number) {
    this._accountsJSONSize = size;
  }
  _preloadJSONSize: number | undefined;
  setPreloadJSONSize(size: number) {
    this._preloadJSONSize = size;
  }

  result(): AuditResult {
    if (!this._totalTime) {
      throw new Error("audit not ended");
    }
    return {
      jsBootTime: this._jsBootTime,
      cpuUserTime: this._cpuUserTime!,
      cpuSystemTime: this._cpuSystemTime!,
      totalTime: this._totalTime,
      memoryEnd: this._endMemory!,
      memoryStart: this._startMemory,
      accountsJSONSize: this._accountsJSONSize,
      preloadJSONSize: this._preloadJSONSize,
      network: this._networkAudit.result(),
      slowFrames: this._slowFrameDetector.result(),
    };
  }
}

class NetworkAudit {
  _obs: PerformanceObserver | undefined;
  _totalTime = 0;
  _totalCount = 0;
  _totalResponseSize = 0;
  _totalDuplicateRequests = 0;
  _urlsSeen = new Set<string>();

  start() {
    this._obs = new PerformanceObserver(this.onPerformanceEntry);
    this._obs.observe({ type: "http" });
  }

  stop() {
    if (this._obs) {
      this._obs.disconnect();
      this._obs = undefined;
    }
  }

  onPerformanceEntry: PerformanceObserverCallback = (items, _observer) => {
    const entries = items.getEntries();
    for (const entry of entries) {
      if (entry.entryType === "http") {
        this._totalCount = (this._totalCount || 0) + 1;
        if (entry.duration) {
          this._totalTime = (this._totalTime || 0) + entry.duration;
        }
        const req = (entry.detail as any)?.req;
        const res = (entry.detail as any)?.res;
        if (res && req) {
          const { url } = req;
          if (this._urlsSeen.has(url)) {
            this._totalDuplicateRequests =
              (this._totalDuplicateRequests || 0) + 1;
          } else {
            this._urlsSeen.add(url);
          }
          const { headers } = res;

          if (headers) {
            const contentLength = headers["content-length"];
            if (contentLength) {
              this._totalResponseSize =
                (this._totalResponseSize || 0) + parseInt(contentLength);
            }
          }
        }
      }
    }
  };

  result(): NetworkAuditResult {
    return {
      totalTime: this._totalTime,
      totalCount: this._totalCount,
      totalResponseSize: this._totalResponseSize,
      totalDuplicateRequests: this._totalDuplicateRequests,
    };
  }
}
