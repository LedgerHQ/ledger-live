import { log } from "@ledgerhq/logs";
import type { Result } from "../cross";
import { accountDataToAccount } from "../cross";
import { checkAccountSupported } from "@ledgerhq/coin-framework/account/index";
import joinSwapHistories from "../exchange/swap/joinSwapHistories";
import isEqual from "lodash/isEqual";
import type { Account } from "@ledgerhq/types-live";
import { BridgeCacheSystem } from "../bridge/cache";
import { getAccountBridge } from "../bridge";
import { promiseAllBatched } from "../promise";
import { getEnv } from "../env";
import { Observable } from "rxjs";
import { reduce } from "rxjs/operators";

const itemModeDisplaySort = {
  create: 1,
  update: 2,
  id: 3,
  unsupported: 4,
};
export type ImportItemMode = keyof typeof itemModeDisplaySort;
export type ImportItem = {
  initialAccountId: string;
  account: Account;
  mode: ImportItemMode;
};
export const importAccountsMakeItems = ({
  result,
  accounts,
  items,
}: {
  result: Result;
  accounts: Account[];
  items?: ImportItem[];
}): ImportItem[] =>
  result.accounts
    .map((accInput) => {
      const prevItem = (items || []).find(
        (item) => item.account.id === accInput.id
      );
      if (prevItem) return prevItem;

      try {
        const account = accountDataToAccount(accInput);
        const error = checkAccountSupported(account);

        if (error) {
          return {
            initialAccountId: account.id,
            account,
            mode: "unsupported",
          };
        }

        const existingAccount = accounts.find((a) => a.id === accInput.id);

        if (existingAccount) {
          // only the name is supposed to change. rest is never changing
          if (
            existingAccount.name === accInput.name &&
            isEqual(existingAccount.swapHistory, account.swapHistory)
          ) {
            return {
              initialAccountId: existingAccount.id,
              account: existingAccount,
              mode: "id",
            };
          }

          return {
            initialAccountId: existingAccount.id,
            account: {
              ...existingAccount,
              name: accInput.name,
              swapHistory: joinSwapHistories(
                existingAccount.swapHistory,
                account.swapHistory
              ),
            },
            mode: "update",
          };
        }

        return {
          initialAccountId: account.id,
          account,
          mode: "create",
        };
      } catch (e) {
        log("error", String(e));
        return null;
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        itemModeDisplaySort[(a as ImportItem).mode] -
        itemModeDisplaySort[(b as ImportItem).mode]
    ) as ImportItem[];

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
 * @param items: result of importAccountsMakeItems
 * @param selectedAccounts: user's selected accounts
 * @param bridgeCache: the bridge cache created on user land to prepare currency for a sync
 * @param blacklistedTokenIds: the list of blacklisted token ids to ignore sync with
 * @returns SyncNewAccountsOutput
 */
export const syncNewAccountsToImport = async (
  { items, selectedAccounts }: SyncNewAccountsInput,
  bridgeCache: BridgeCacheSystem,
  blacklistedTokenIds?: string[]
): Promise<SyncNewAccountsOutput> => {
  const selectedItems = items.filter((item) =>
    selectedAccounts.includes(item.account.id)
  );
  const synchronized = {};
  const failed = {};
  await promiseAllBatched(
    getEnv("SYNC_MAX_CONCURRENT"),
    selectedItems,
    async ({ account }) => {
      try {
        const bridge = getAccountBridge(account);
        await bridgeCache.prepareCurrency(account.currency);
        const syncConfig = {
          paginationConfig: {},
          blacklistedTokenIds,
        };
        const observable = bridge.sync(account, syncConfig);
        const reduced: Observable<Account> = observable.pipe(
          reduce((a, f: (_: Account) => Account) => f(a), account)
        );
        const synced = await reduced.toPromise();
        synchronized[account.id] = synced;
      } catch (e) {
        failed[account.id] = e;
      }
    }
  );
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
 * @param items: value resulting of importAccountsMakeItems
 * @params selectedAccounts: array of all account ids selected by user for import
 * @param syncedNewAccounts: accounts resulting of syncNewAccountsToImport(). all accounts that would be missing from that list would be ignored to be imported (fresh sync is needed to make sure the accounts are "ready")
 * @returns all accounts
 */
export const importAccountsReduce = (
  existingAccounts: Account[],
  { items, selectedAccounts, syncResult }: ImportAccountsReduceInput
): Account[] => {
  const accounts = existingAccounts.slice(0);
  const selectedItems = items.filter((item) =>
    selectedAccounts.includes(item.account.id)
  );

  for (const {
    mode,
    account: { id },
    initialAccountId,
  } of selectedItems) {
    const account = syncResult.synchronized[id];
    if (!account) continue;
    switch (mode) {
      case "create": {
        const exists = accounts.find(
          (a) => a.id === initialAccountId || a.id === id
        );
        if (!exists) {
          // prevent duplicate cases to happen (in case of race condition)
          accounts.push(account);
        }
        break;
      }

      case "update": {
        const item = accounts.find(
          (a) => a.id === initialAccountId || a.id === id
        );
        const i = accounts.indexOf(item as Account);
        if (i !== -1) {
          accounts[i] = account;
        }
        break;
      }

      default:
    }
  }

  return accounts;
};
