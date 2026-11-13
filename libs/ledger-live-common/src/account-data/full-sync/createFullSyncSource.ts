import type { Account } from "@ledgerhq/types-live";
import {
  DEFAULT_ACCOUNT_DATA_MAX_AGE,
  type AccountDataSource,
  type AccountTarget,
} from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import { getEnv } from "@shared/env";
import { FullSyncAccountNotFoundError } from "./errors";
import { toAccountReceive } from "./receive";
import { toAccountBalances } from "./balance";
import { toAccountBalanceHistory } from "./balanceHistory";
import { toAccountOperations } from "./operations";
import { toAccountStatus } from "./accountStatus";
import { toAssetStatus } from "./assetStatus";
import { syncDetached } from "./syncDetached";
import { isFullSyncSupported } from "./supports";
import { syncLegacyAccount, type SyncLegacyAccountOptions } from "./syncLegacyAccount";

export type FullSyncHost = Pick<
  SyncLegacyAccountOptions,
  "prepareCurrency" | "updateAccountWithUpdater"
> & {
  /** The legacy account behind an account, if the legacy store holds one. */
  findAccount(accountUUID: AccountUUID): Account | undefined;
  blacklistedTokenIds?(): string[];
};

export type FullSyncSource = AccountDataSource & {
  /** The account as the store holds it once synced, sharing the sync in flight for it if any. */
  sync(target: AccountTarget): Promise<Account>;
};

const notFound = (accountUUID: AccountUUID) =>
  new FullSyncAccountNotFoundError(`No legacy account in the store for ${accountUUID}`);

/** Every kind from one `AccountBridge.sync()`, the one the background sync runs: the legacy path. `accountStatus` also answers for accounts the store does not hold (discovery candidates). */
export function createFullSyncSource(host: FullSyncHost): FullSyncSource {
  const sync = async ({ accountUUID }: AccountTarget): Promise<Account> => {
    const account = host.findAccount(accountUUID);
    if (!account) throw notFound(accountUUID);
    await syncLegacyAccount(
      account,
      {
        prepareCurrency: host.prepareCurrency,
        updateAccountWithUpdater: host.updateAccountWithUpdater,
        blacklistedTokenIds: host.blacklistedTokenIds?.() ?? [],
      },
      DEFAULT_ACCOUNT_DATA_MAX_AGE,
    );
    const synced = host.findAccount(accountUUID);
    if (!synced) throw notFound(accountUUID);
    return synced;
  };

  // A discovery candidate the store does not hold yet gets one sync kept out of the store.
  const syncHeldOrDetached = (target: AccountTarget): Promise<Account> =>
    host.findAccount(target.accountUUID)
      ? sync(target)
      : syncDetached(
          target.descriptor,
          {
            prepareCurrency: host.prepareCurrency,
            blacklistedTokenIds: host.blacklistedTokenIds?.() ?? [],
          },
          target.signal,
        );

  return {
    id: AccountDataSourceIdSchema.parse("full-sync"),
    concurrency: getEnv("SYNC_MAX_CONCURRENT"),
    supports: isFullSyncSupported,
    // One line per kind, mapping the synced account with its own file.
    read: {
      balance: target => sync(target).then(toAccountBalances),
      operations: (target, query) =>
        sync(target).then(account => toAccountOperations(account, query)),
      balanceHistory: (target, query) =>
        sync(target).then(account => toAccountBalanceHistory(account, query)),
      receive: target => sync(target).then(toAccountReceive),
      accountStatus: target => syncHeldOrDetached(target).then(toAccountStatus),
      assetStatus: (target, query) => toAssetStatus(target, query, sync),
    },
    sync,
  };
}
