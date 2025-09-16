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

interface RunResult {
  entries: LogEntry[];
  failed: boolean;
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
        const initialAccount = await sync(toEmptyAccount(currency, info));
        const endScan = Date.now();

        const startSync = Date.now();
        await sync(initialAccount);
        const endSync = Date.now();

        const scanDuration = endScan - startScan;
        const syncDuration = endSync - startSync;

        const { xpubOrAddress } = decodeAccountId(initialAccount.id);

        console.log(`[${i} / ${nbOfAccounts}] Completed in ${scanDuration + syncDuration} ms`);

        result.entries.push(
          {
            duration: scanDuration,
            currencyName: currency.id,
            coinModuleName: currency.family,
            operationType: "scan",
            accountType: accountType as AccountType,
            transactions: initialAccount.operationsCount,
            accountAddressOrXpub: xpubOrAddress,
          },
          {
            duration: syncDuration,
            currencyName: currency.id,
            coinModuleName: currency.family,
            operationType: "sync",
            accountType: accountType as AccountType,
            transactions: initialAccount.operationsCount,
            accountAddressOrXpub: xpubOrAddress,
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
