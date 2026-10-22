import type { Account } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily } from "@ledgerhq/live-common/bridge/impl";
import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import {
  type CryptoCurrency,
  getCryptoCurrencyById,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  listCryptoCurrencies,
  hasCryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { setCurrenciesResolver } from "@ledgerhq/ledger-wallet-framework/currencies";
import { firstValueFrom, reduce } from "rxjs";
import {
  decodeAccountId,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { isGenericCoinFrameworkFamily } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import currencies, { AccountInfo, AccountType } from "./currencies";
import { FailureLogEntry, LogEntry, submitLogs } from "./datadog";
import { measureThroughput } from "./huge";
import { Dist, computeStats, measureCalls } from "./measure";

interface RunResult {
  entries: LogEntry[];
  failures: FailureLogEntry[];
  failed: boolean;
}

function rates(operations: number, calls: number, durationMs: number) {
  return {
    opsPerSecond: durationMs ? operations / (durationMs / 1000) : 0,
    callsPerOperation: operations ? calls / operations : 0,
  };
}

function formatDist(dist: Dist, unit = "", decimals = 3) {
  const round = (v: number) => Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `min=${round(dist.min)}${unit}, average=${round(dist.average)}${unit}, max=${round(dist.max)}${unit}, p90=${round(dist.p90)}${unit}, p99=${round(dist.p99)}${unit}`;
}

function formatCalls(total: number, calls: Record<string, number>) {
  return (
    `Total: ${total} ` +
    Object.entries(calls)
      .map(([domain, nbOfCalls]) => `- ${domain}: ${nbOfCalls}`)
      .join(" ")
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)} ms`;

  const totalSeconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const parts: string[] = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || (!hours && !minutes)) {
    if (remainingMs > 0 && ms < 60_000) {
      parts.push(`${seconds}.${remainingMs.toString().padStart(3, "0")}s`);
    } else {
      parts.push(`${seconds}s`);
    }
  }

  return parts.join(" ");
}

function hasCauseProperty(object: unknown): object is { cause: object } {
  return (
    typeof object === "object" &&
    object !== null &&
    "cause" in object &&
    typeof object.cause === "object" &&
    object.cause !== null
  );
}

function objectWithoutKeys(obj: object, excludeKeys: string[]): Record<string, unknown> {
  const set = new Set(excludeKeys);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !set.has(key)));
}

function logErrorProperties(error: Error): void {
  const errorProperties = objectWithoutKeys(error, ["message", "stack", "cause"]);
  console.error(` └─ Error properties:`, errorProperties);

  if (hasCauseProperty(error)) {
    const causeProperties = objectWithoutKeys(error.cause, ["stack", "cause"]);
    console.error(`  └─ Error cause properties:`, causeProperties);
  }
}

function prettyLog(
  i: number,
  nbOfAccounts: number,
  scanDuration: number,
  syncDuration: number,
  scanCalls: number,
  scanRoutes: Record<string, number>,
  scanCpu: Dist,
  scanMem: Dist,
  syncCalls: number,
  syncRoutes: Record<string, number>,
  syncCpu: Dist,
  syncMem: Dist,
) {
  const totalDuration = scanDuration + syncDuration;

  console.log(`\n[${i} / ${nbOfAccounts}] ✅ Completed in ${formatDuration(totalDuration)}`);

  console.log(` ┌─ 🔎 Scan`);
  console.log(` │  • Calls: ${formatCalls(scanCalls, scanRoutes)}`);
  console.log(` │  • CPU  : ${formatDist(scanCpu, "%")}`);
  console.log(` │  • MEM  : ${formatDist(scanMem, " MB")}`);

  console.log(` └─ 🔄 Sync`);
  console.log(`    • Calls: ${formatCalls(syncCalls, syncRoutes)}`);
  console.log(`    • CPU  : ${formatDist(syncCpu, "%")}`);
  console.log(`    • MEM  : ${formatDist(syncMem, " MB")}\n`);
}

function toEmptyAccount(currency: CryptoCurrency, info: AccountInfo): Account {
  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: info.xpub ?? info.address,
    derivationMode: info.derivationMode ?? "",
  });
  return {
    id,
    currency,
    freshAddress: info.address,
    xpub: info.xpub,
    derivationMode: info.derivationMode ?? "",
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {},
    blockHeight: 0,
  } as unknown as Account;
}

function getSync(currency: CryptoCurrency) {
  const bridge = getAccountBridgeByFamily(currency.family);

  return async (account: Account) =>
    firstValueFrom(
      (await bridge)
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account)),
    );
}

const ACCOUNT_SYNC_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes per scan or sync phase

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new TimeoutError(`${label} timed out after ${ACCOUNT_SYNC_TIMEOUT_MS / 1000}s`)),
      ACCOUNT_SYNC_TIMEOUT_MS,
    );
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export default async function (currencyIds: string[], accountTypes: AccountType[]) {
  registerAllCoins();

  LiveConfig.setConfig(liveConfig);

  setCryptoAssetsStore(
    buildStandaloneCryptoAssetsStore({
      calServiceUrl: process.env.CAL_SERVICE_URL ?? "https://global.api.prd.ledger.com/cal",
      ledgerClientVersion: process.env.LEDGER_CLIENT_VERSION ?? "monitoring",
    }),
  );
  setCurrenciesResolver({
    getCryptoCurrencyById,
    findCryptoCurrencyById,
    findCryptoCurrencyByScheme,
    listCryptoCurrencies,
    hasCryptoCurrencyId,
  });
  const result: RunResult = {
    entries: [],
    failures: [],
    failed: false,
  };

  const nbOfAccounts = currencyIds
    .flatMap(currencyId => Object.keys(currencies[currencyId].accounts))
    .filter(currencyAccountType => accountTypes.some(type => type === currencyAccountType)).length;
  let i = 0;
  console.log(`Monitoring ${nbOfAccounts} account(s) within ${currencyIds.join(", ")}`);

  for (const currencyId of currencyIds) {
    const monitored = currencies[currencyId];

    const currency = getCryptoCurrencyById(currencyId);
    const sync = getSync(currency);

    for (const accountType of accountTypes) {
      const info = monitored.accounts[accountType];

      if (!info) {
        console.log(`\nSkipping currency = "${currencyId}", no account = "${accountType}"`);
        continue;
      }

      console.log(
        `\n[${++i} / ${nbOfAccounts}] Start (currency = "${currencyId}" account = "${accountType}")`,
      );

      // Phase in progress, to report a failure on the right operation
      let operationType: LogEntry["operationType"] = accountType === "huge" ? "throughput" : "scan";
      let phaseStart = Date.now();

      try {
        if (accountType === "huge") {
          // Without a local coin module, the call would silently go to the coin service instead
          if (!isGenericCoinFrameworkFamily(currency.family)) {
            console.log(
              `Skipping, family "${currency.family}" is not on the generic coin framework`,
            );
            continue;
          }
          const {
            result: throughput,
            totalCalls,
            callsByDomain,
            cpu,
            memory,
          } = await withTimeout(
            measureCalls(() => measureThroughput(currency.id, currency.family, info.address)),
            `${currencyId}/${accountType} throughput`,
          );
          // Only the pages are timed, not the lazy loading of the coin module
          const duration = throughput.pageDurations.reduce((sum, d) => sum + d, 0);
          const { opsPerSecond, callsPerOperation } = rates(
            throughput.operations,
            totalCalls,
            duration,
          );

          console.log(
            `\n[${i} / ${nbOfAccounts}] 📈 Throughput: ${throughput.operations} operations in ${formatDuration(duration)} (${opsPerSecond.toFixed(1)} ops/s, ${callsPerOperation.toFixed(2)} calls/op, ${throughput.pageDurations.length} pages, exhausted=${throughput.exhausted})`,
          );

          result.entries.push({
            outcome: "success",
            duration,
            currencyName: currency.id,
            coinModuleName: currency.family,
            operationType: "throughput",
            accountType,
            transactions: throughput.operations,
            accountAddressOrXpub: info.address,
            totalNetworkCalls: totalCalls,
            networkCallsByDomain: callsByDomain,
            cpu,
            memory,
            opsPerSecond,
            callsPerOperation,
            pages: throughput.pageDurations.length,
            pageDuration: computeStats(throughput.pageDurations),
            exhausted: throughput.exhausted,
          });
          continue;
        }

        const startScan = Date.now();
        const {
          result: initialAccount,
          totalCalls: scanCalls,
          callsByDomain: scanRoutes,
          cpu: scanCpu,
          memory: scanMem,
        } = await withTimeout(
          measureCalls(() => sync(toEmptyAccount(currency, info))),
          `${currencyId}/${accountType} scan`,
        );
        const endScan = Date.now();
        const scanDuration = endScan - startScan;
        const { xpubOrAddress } = decodeAccountId(initialAccount.id);

        // Pushed before the sync, so that a failing sync does not drop the scan measurements
        result.entries.push({
          outcome: "success",
          duration: scanDuration,
          currencyName: currency.id,
          coinModuleName: currency.family,
          operationType: "scan",
          accountType: accountType as AccountType,
          transactions: initialAccount.operationsCount,
          accountAddressOrXpub: xpubOrAddress,
          totalNetworkCalls: scanCalls,
          networkCallsByDomain: scanRoutes,
          cpu: scanCpu,
          memory: scanMem,
          ...rates(initialAccount.operationsCount, scanCalls, scanDuration),
        });

        const startSync = Date.now();
        operationType = "sync";
        phaseStart = startSync;
        const {
          totalCalls: syncCalls,
          callsByDomain: syncRoutes,
          cpu: syncCpu,
          memory: syncMem,
        } = await withTimeout(
          measureCalls(() => sync(initialAccount)),
          `${currencyId}/${accountType} sync`,
        );
        const endSync = Date.now();

        const syncDuration = endSync - startSync;

        prettyLog(
          i,
          nbOfAccounts,
          scanDuration,
          syncDuration,
          scanCalls,
          scanRoutes,
          scanCpu,
          scanMem,
          syncCalls,
          syncRoutes,
          syncCpu,
          syncMem,
        );

        result.entries.push({
          outcome: "success",
          duration: syncDuration,
          currencyName: currency.id,
          coinModuleName: currency.family,
          operationType: "sync",
          accountType: accountType as AccountType,
          transactions: initialAccount.operationsCount,
          accountAddressOrXpub: xpubOrAddress,
          totalNetworkCalls: syncCalls,
          networkCallsByDomain: syncRoutes,
          cpu: syncCpu,
          memory: syncMem,
        });
      } catch (err) {
        console.error(
          `Skipping failing run. Error: ${err instanceof Error ? (err.stack ?? err.message) : err}`,
        );
        // We may miss some parameters added to the error on runtime
        // We display only the message on the top for convenience and better readability
        // So we added this log to have the full object
        if (err instanceof Error) {
          logErrorProperties(err);
        }
        result.failures.push({
          outcome: err instanceof TimeoutError ? "timeout" : "error",
          error: err instanceof Error ? err.message : String(err),
          failedAfter: Date.now() - phaseStart,
          currencyName: currency.id,
          coinModuleName: currency.family,
          operationType,
          accountType,
          accountAddressOrXpub: info.xpub ?? info.address,
        });
        // A huge account only reports its throughput, its failures do not fail the run
        if (accountType !== "huge") {
          result.failed = true;
        }
      }
    }
  }

  await submitLogs([...result.entries, ...result.failures]);

  return result;
}
