import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as store from "@ledgerhq/cryptoassets/tokens";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily, setup } from "@ledgerhq/live-common/bridge/impl";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { firstValueFrom, reduce } from "rxjs";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import currencies, { AccountInfo, AccountType } from "./currencies";
import { LogEntry, submitLogs } from "./datadog";
import { Dist, measureCalls } from "./measure";

interface RunResult {
  entries: LogEntry[];
  failed: boolean;
}

function formatDist(dist: Dist, unit = "", decimals = 3) {
  const round = (v: number) => Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `min=${round(dist.min)}${unit}, median=${round(dist.median)}${unit}, max=${round(dist.max)}${unit}, p90=${round(dist.p90)}${unit}, p99=${round(dist.p99)}${unit}`;
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
  } as unknown as Account;
}

function getSync(currency: CryptoCurrency) {
  const bridge = getAccountBridgeByFamily(currency.family);

  return (account: Account) =>
    firstValueFrom(
      bridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account)),
    );
}

export default async function (currencyIds: string[]) {
  LiveConfig.setConfig(liveConfig);
  setup(store);
  const result: RunResult = {
    entries: [],
    failed: false,
  };

  const nbOfAccounts = currencyIds
    .map(currencyId => Object.keys(currencies[currencyId].accounts).length)
    .reduce((previous, current) => previous + current, 0);
  let i = 0;
  console.log(`Monitoring ${nbOfAccounts} account(s) within ${currencyIds.join(", ")}`);

  for (const currencyId of currencyIds) {
    const monitored = currencies[currencyId];

    const currency = getCryptoCurrencyById(currencyId);
    const sync = getSync(currency);

    for (const [accountType, info] of Object.entries(monitored.accounts)) {
      console.log(
        `\n[${++i} / ${nbOfAccounts}] Start (currency = "${currencyId}" account = "${accountType}")`,
      );

      try {
        const startScan = Date.now();
        const {
          result: initialAccount,
          totalCalls: scanCalls,
          callsByDomain: scanRoutes,
          cpu: scanCpu,
          memory: scanMem,
        } = await measureCalls(() => sync(toEmptyAccount(currency, info)));
        const endScan = Date.now();

        const startSync = Date.now();
        const {
          totalCalls: syncCalls,
          callsByDomain: syncRoutes,
          cpu: syncCpu,
          memory: syncMem,
        } = await measureCalls(() => sync(initialAccount));
        const endSync = Date.now();

        const scanDuration = endScan - startScan;
        const syncDuration = endSync - startSync;

        const { xpubOrAddress } = decodeAccountId(initialAccount.id);

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

        result.entries.push(
          {
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
          },
          {
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
          },
        );
      } catch (err) {
        console.error(
          `Skipping failing run. Error: ${err instanceof Error ? err.stack ?? err.message : err}`,
        );
        result.failed = true;
      }
    }
  }

  await submitLogs(result.entries);

  return result;
}
