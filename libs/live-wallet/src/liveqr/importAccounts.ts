import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { getEnv } from "@ledgerhq/live-env";
import { Observable, firstValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { BridgeCacheSystem } from "@ledgerhq/types-live";

export type ImportItemMode = "create" | "update" | "id" | "unsupported";
export type ImportItem = {
  initialAccountId: string;
  account: Account;
  mode: ImportItemMode;
};

/**
 * SyncNewAccountsOutput
 * - synchronized: a map of account id to account. the account id are kept as originally set in the items[].account before a possible "remap" of the ids after a sync happened
 * - failed: a map of account id to errors for all possible fails that happened.
 */
export type SyncNewAccountsOutput = {
  synchronized: Record<string, Account>;
  failed: Record<string, Error>;
};

export type SyncNewAccountsInput = {
  items: ImportItem[];
  selectedAccounts: string[];
};

/**
 *
 * @param items: import items to sync
 * @param selectedAccounts: user's selected accounts
 * @param bridgeCache: the bridge cache created on user land to prepare currency for a sync
 * @param blacklistedTokenIds: the list of blacklisted token ids to ignore sync with
 * @returns SyncNewAccountsOutput
 */
export const syncNewAccountsToImport = async (
  { items, selectedAccounts }: SyncNewAccountsInput,
  getAccountBridge: <T extends TransactionCommon>(account: Account) => AccountBridge<T>,
  bridgeCache: BridgeCacheSystem,
  blacklistedTokenIds?: string[],
): Promise<SyncNewAccountsOutput> => {
  const selectedItems = items.filter(item => selectedAccounts.includes(item.account.id));
  const synchronized: Record<string, Account> = {};
  const failed: Record<string, Error> = {};
  await promiseAllBatched(getEnv("SYNC_MAX_CONCURRENT"), selectedItems, async ({ account }) => {
    try {
      const bridge = getAccountBridge(account);
      await bridgeCache.prepareCurrency(account.currency);
      const syncConfig = {
        paginationConfig: {},
        blacklistedTokenIds,
      };
      const observable = bridge.sync(account, syncConfig);
      const reduced: Observable<Account> = observable.pipe(
        reduce((a, f: (_: Account) => Account) => f(a), account),
      );
      const synced = await firstValueFrom(reduced);
      synchronized[account.id] = synced;
    } catch (e) {
      failed[account.id] = e instanceof Error ? e : new Error(String(e));
    }
  });
  return { synchronized, failed };
};

export type ImportAccountsReduceInput = {
  items: ImportItem[];
  selectedAccounts: string[];
  syncResult: SyncNewAccountsOutput;
};

/**
 *
 * @param existingAccounts
 * @param items: import items to process
 * @params selectedAccounts: array of all account ids selected by user for import
 * @param syncedNewAccounts: accounts resulting of syncNewAccountsToImport(). all accounts that would be missing from that list would be ignored to be imported (fresh sync is needed to make sure the accounts are "ready")
 * @returns all accounts
 */
export const importAccountsReduce = (
  existingAccounts: Account[],
  { items, selectedAccounts, syncResult }: ImportAccountsReduceInput,
): Account[] => {
  const accounts = existingAccounts.slice(0);
  const selectedItems = items.filter(item => selectedAccounts.includes(item.account.id));

  for (const {
    mode,
    account: { id },
    initialAccountId,
  } of selectedItems) {
    const account = syncResult.synchronized[id];
    if (!account) continue;
    switch (mode) {
      case "create": {
        const exists = accounts.find(a => a.id === initialAccountId || a.id === id);
        if (!exists) {
          // prevent duplicate cases to happen (in case of race condition)
          accounts.push(account);
        }
        break;
      }

      case "update": {
        const item = accounts.find(a => a.id === initialAccountId || a.id === id);
        if (item) {
          const i = accounts.indexOf(item);
          if (i !== -1) {
            accounts[i] = account;
          }
        }
        break;
      }

      default:
    }
  }

  return accounts;
};
