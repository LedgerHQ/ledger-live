"use strict";
import "../../__tests__/test-helpers/environment";
// import path from "path";
// import fs from "fs/promises";
import allSpecs from "../../generated/specs";
import type { AppSpec } from "../types";
import { Account } from "@ledgerhq/types-live";
import { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import {
  createSpeculosDevice,
  findAppCandidate,
  listAppCandidates,
  releaseSpeculosDevice,
} from "../../load/speculos";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { getCurrencyBridge } from "../../bridge";
import { filter, map, reduce, timeoutWith } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-env";
import { throwError } from "rxjs";
import { Report } from "./types";
import { toAccountRaw } from "../../account";
import { Audit } from "./audits";

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
    const audit = new Audit();

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
    report.accountIds = accounts.map((a) => a.id);
    report.accountOperationsLength = accounts.map((a) => a.operations.length);
    report.auditResult = audit.result();
  } finally {
    await releaseSpeculosDevice(device.id);
  }

  return report;
}
