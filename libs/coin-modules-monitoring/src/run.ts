import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as store from "@ledgerhq/cryptoassets/tokens";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily, setup } from "@ledgerhq/live-common/bridge/impl";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { firstValueFrom, reduce } from "rxjs";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import accounts, { AccountInfo, AccountType } from "./accounts";
import { LogEntry, submitLogs } from "./datadog";

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
  const entries: LogEntry[] = [];

  const nbOfAccounts = currencyIds
    .map(currencyId => Object.keys(accounts[currencyId]).length)
    .reduce((previous, current) => previous + current, 0);
  let i = 0;
  console.log(`Monitoring ${nbOfAccounts} account(s) within ${currencyIds.join(", ")}`);

  for (const currencyId of currencyIds) {
    const currency = getCryptoCurrencyById(currencyId);
    const sync = getSync(currency);

    for (const [accountType, info] of Object.entries(accounts[currencyId])) {
      console.log(
        `\n[${++i} / ${nbOfAccounts}] Start (currency = "${currencyId}" account = "${accountType}")`,
      );

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

      entries.push(
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
    }
  }

  await submitLogs(entries);

  return entries;
}
