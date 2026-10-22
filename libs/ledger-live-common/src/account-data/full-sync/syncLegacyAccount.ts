import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge";
import { legacySyncConfig } from "../../bridge/syncConfig";

export type SyncLegacyAccountOptions = {
  prepareCurrency(currency: Account["currency"]): Promise<unknown>;
  blacklistedTokenIds: string[];
};

/** The account its `AccountBridge.sync()` folds to. */
export async function syncLegacyAccount(
  account: Account,
  { prepareCurrency, blacklistedTokenIds }: SyncLegacyAccountOptions,
): Promise<Account> {
  await prepareCurrency(account.currency);
  const bridge = await getAccountBridge(account);
  return lastValueFrom(
    bridge
      .sync(account, legacySyncConfig(account.currency.id, blacklistedTokenIds))
      .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account)),
  );
}
