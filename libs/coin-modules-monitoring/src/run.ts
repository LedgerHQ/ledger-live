import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily } from "@ledgerhq/live-common/bridge/impl";
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
  const entries: LogEntry[] = [];

  for (const currencyId of currencyIds) {
    const currency = getCryptoCurrencyById(currencyId);
    const sync = getSync(currency);

    for (const [accountType, info] of Object.entries(accounts[currencyId])) {
      const startScan = Date.now();
      const initialAccount = await sync(toEmptyAccount(currency, info));
      const endScan = Date.now();

      const startSync = Date.now();
      await sync(initialAccount);
      const endSync = Date.now();

      const { xpubOrAddress } = decodeAccountId(initialAccount.id);

      entries.push(
        {
          duration: endScan - startScan,
          currencyName: currency.id,
          coinModuleName: currency.family,
          operationType: "scan",
          accountType: accountType as AccountType,
          transactions: initialAccount.operationsCount,
          accountAddressOrXpub: xpubOrAddress,
        },
        {
          duration: endSync - startSync,
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
