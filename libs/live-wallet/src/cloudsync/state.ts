import { Account, AccountBridge, BridgeCacheSystem, TransactionCommon } from "@ledgerhq/types-live";
import { LiveData } from ".";
import { AccountDescriptor } from "./datatypes/live";
import { accountDataToAccount } from "../liveqr/cross";
import { Observable, firstValueFrom, reduce } from "rxjs";
import { promiseAllBatched } from "@ledgerhq/live-promise";

export type WalletSyncState = {
  data: LiveData | null;
  version: number;
};

export type WalletSyncDiff = {
  currentState: WalletSyncState;
  newState: WalletSyncState;
  added: AccountDescriptor[]; // NB: what's considered "added" is based on the id. we assume all other fields of AccountDescriptor are not relevant for diffing
  removed: string[];
  newNamesState: Map<string, string>;

  // with this info, we know if we need to push or not / to apply a local change or not
  hasChanges: boolean;
};

export function diffWalletSyncState(
  currentState: WalletSyncState,
  newState: WalletSyncState,
): WalletSyncDiff {
  const added: AccountDescriptor[] = [];
  const removed: string[] = [];
  const newNamesState = new Map<string, string>();
  const existingIds = new Set<string>();
  if (currentState.data) {
    for (const { id } of currentState.data.accounts) {
      existingIds.add(id);
    }
    for (const [id, name] of Object.entries(currentState.data.accountNames)) {
      newNamesState.set(id, name);
    }
  }
  if (newState.data) {
    const nextIds = new Set<string>();
    for (const data of newState.data.accounts) {
      nextIds.add(data.id);
      if (!existingIds.has(data.id)) {
        added.push(data);
      }
    }
    for (const [id, name] of Object.entries(newState.data.accountNames)) {
      newNamesState.set(id, name);
    }
    for (const id of existingIds) {
      if (!nextIds.has(id)) {
        removed.push(id);
      }
    }
  }
  const hasChanges = true; // FIXME
  return { currentState, newState, added, removed, newNamesState, hasChanges };
}

/**
 * accept an AccountDescriptor to actively add it as an account
 * it is async because we need to perform a full sync that
 * will validate the data is valid (and that a coin correctly
 * make it work) and that it has all the necessary fields automatically filled.
 * in case of failure, the promise would fail and it's your responsability to re-try later in case of failure. we will have to implement a retrial strategy and minimize calls to integrateNewAccountDescriptor
 * @param account
 * @param getAccountBridge: implementation of live-common's getAccountBridge (since this lib don't depends on live-common)
 *
 */
export async function integrateNewAccountDescriptor<T extends TransactionCommon>(
  accountDescriptor: AccountDescriptor,
  getAccountBridge: (account: Account) => AccountBridge<T>,
  bridgeCache: BridgeCacheSystem,
  blacklistedTokenIds?: string[],
): Promise<Account> {
  // FIXME: in future, it should be part of the bridge to accept an AccountDescriptor. today we rely on accountDataToAccount to not duplicates its internal hacks to not break coin implementations but eventually this logic will have to be simplified/unified.
  const [accountShaped] = accountDataToAccount({ ...accountDescriptor, balance: "0", name: "" });
  const bridge = getAccountBridge(accountShaped);
  await bridgeCache.prepareCurrency(accountShaped.currency);
  const syncConfig = {
    paginationConfig: {},
    blacklistedTokenIds,
  };
  const observable = bridge.sync(accountShaped, syncConfig);
  const reduced: Observable<Account> = observable.pipe(
    reduce((a, f: (_: Account) => Account) => f(a), accountShaped),
  );
  const synced = await firstValueFrom(reduced);
  return synced;
}

export type WalletSyncAccountsUpdate = {
  newState: WalletSyncState;
  added: Account[];
  removed: string[];
  newNamesState: Map<string, string>;
  // for each account.id, we return failure metadata
  failures: Record<
    string,
    {
      error: Error;
      timestamp: number;
    }
  >;
};

/**
 * logic related to {wallet sync data update -> local state} management
 */
export async function resolveWalletSyncDiffIntoSyncUpdate(
  diff: WalletSyncDiff,
  getAccountBridge: <T extends TransactionCommon>(account: Account) => AccountBridge<T>,
  bridgeCache: BridgeCacheSystem,
  blacklistedTokenIds?: string[],
): Promise<WalletSyncAccountsUpdate> {
  const failures: WalletSyncAccountsUpdate["failures"] = {};

  const added = (
    await promiseAllBatched(3, diff.added, async descriptor => {
      try {
        const account = await integrateNewAccountDescriptor(
          descriptor,
          getAccountBridge,
          bridgeCache,
          blacklistedTokenIds,
        );
        return account;
      } catch (error) {
        failures[descriptor.id] = {
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: Date.now(),
        };
      }
    })
  ).filter(Boolean) as Account[];

  return {
    newState: diff.newState,
    removed: diff.removed,
    newNamesState: diff.newNamesState,
    added,
    failures,
  };
}
