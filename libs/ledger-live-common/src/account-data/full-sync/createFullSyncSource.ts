import type { Account } from "@ledgerhq/types-live";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import { getEnv } from "@shared/env";
import { toAccountBalances } from "./balance";
import { dedupeInFlight } from "./dedupeInFlight";
import { FullSyncAccountNotFoundError } from "./errors";
import { isFullSyncSupported } from "./supports";
import { syncLegacyAccount, type SyncLegacyAccountOptions } from "./syncLegacyAccount";

export type FullSyncHost = {
  /** The legacy account behind an account, if the legacy store holds one. */
  findAccount(accountUUID: AccountUUID): Account | undefined;
  prepareCurrency: SyncLegacyAccountOptions["prepareCurrency"];
  blacklistedTokenIds?(): string[];
};

export type FullSyncSource = AccountDataSource & {
  /** The synced account, sharing the sync in flight for it if any. */
  sync(target: AccountTarget): Promise<Account>;
};

/** Every kind from one `AccountBridge.sync()`, one sync per account in flight: the legacy path. */
export function createFullSyncSource(host: FullSyncHost): FullSyncSource {
  const shared = dedupeInFlight<string, Account>();

  const sync = ({ accountUUID }: AccountTarget): Promise<Account> => {
    const account = host.findAccount(accountUUID);
    if (!account) {
      return Promise.reject(
        new FullSyncAccountNotFoundError(`No legacy account in the store for ${accountUUID}`),
      );
    }
    return shared(account.id, () =>
      syncLegacyAccount(account, {
        prepareCurrency: host.prepareCurrency,
        blacklistedTokenIds: host.blacklistedTokenIds?.() ?? [],
      }),
    );
  };

  return {
    id: AccountDataSourceIdSchema.parse("full-sync"),
    concurrency: getEnv("SYNC_MAX_CONCURRENT"),
    supports: isFullSyncSupported,
    // One line per kind, mapping the synced account with its own file (LIVE-39359).
    read: {
      balance: target => sync(target).then(toAccountBalances),
    },
    sync,
  };
}
