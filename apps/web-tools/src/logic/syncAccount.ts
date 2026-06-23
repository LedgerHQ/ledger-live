import { BigNumber } from "bignumber.js";
import { decodeAccountId, emptyHistoryCache } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Account, DerivationMode } from "@ledgerhq/types-live";

const localCache: Record<string, unknown> = {};
const bridgeCache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },

  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

export function inferAccount(id: string): Account {
  const { derivationMode, xpubOrAddress, currencyId } = decodeAccountId(id);
  const currency = getCryptoCurrencyById(currencyId);
  const scheme = getDerivationScheme({
    derivationMode: derivationMode as DerivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });
  const account: Account = {
    type: "Account",
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    id,
    derivationMode,
    currency,
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
  return account;
}

export async function syncAccount(id: string): Promise<Account> {
  const account = inferAccount(id);
  const bridge = await getAccountBridge(account);
  await bridgeCache.prepareCurrency(account.currency);
  const syncConfig = {
    paginationConfig: {},
    blacklistedTokenIds: [],
  };
  const observable = bridge.sync(account, syncConfig);
  const reduced = observable.pipe(reduce((a, f) => f(a), account));
  return lastValueFrom(reduced);
}
