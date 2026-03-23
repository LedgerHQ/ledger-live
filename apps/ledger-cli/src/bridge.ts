import type { Account, SyncConfig } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { reduce } from "rxjs/operators";
import { lastValueFrom } from "rxjs";

const localCache: Record<string, unknown> = {};

export const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },
  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

const defaultSyncConfig: SyncConfig = {
  paginationConfig: {},
};

/**
 * Sync an account from the blockchain. Returns the fully synced account.
 * Handles currency preparation (bridge cache) automatically.
 */
export async function syncAccount(
  account: Account,
  syncConfig: SyncConfig = defaultSyncConfig,
): Promise<Account> {
  await cache.prepareCurrency(account.currency);
  return lastValueFrom(
    getAccountBridge(account, null)
      .sync(account, syncConfig)
      .pipe(reduce((a: Account, f: (a: Account) => Account) => f(a), account)),
  );
}

export async function prepareCurrency(currency: CryptoCurrency): Promise<void> {
  await cache.prepareCurrency(currency);
}

export { getAccountBridge };
