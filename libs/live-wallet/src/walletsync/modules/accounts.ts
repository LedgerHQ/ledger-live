import { Account, AccountBridge, BridgeCacheSystem, TransactionCommon } from "@ledgerhq/types-live";
import { WalletSyncDataManager, WalletSyncDataManagerResolutionContext } from "../types";
import { z } from "zod";
import { accountDataToAccount } from "../../liveqr/cross";
import { Observable, firstValueFrom, reduce } from "rxjs";
import { promiseAllBatched } from "@ledgerhq/live-promise";

const accountDescriptorSchema = z.object({
  id: z.string(),
  currencyId: z.string(),
  freshAddress: z.string(),
  seedIdentifier: z.string(),
  derivationMode: z.string(),
  index: z.number(),
});

type AccountDescriptor = z.infer<typeof accountDescriptorSchema>;

const schema = z.array(accountDescriptorSchema);

export type NonImportedAccountInfo = {
  id: string;
  attempts: number;
  attemptsLastTimestamp: number;
  error?: {
    name: string;
    message: string;
  };
};

const manager: WalletSyncDataManager<
  {
    list: Account[];
    nonImportedAccountInfos: NonImportedAccountInfo[];
  },
  {
    removed: string[];
    added: Account[];
    nonImportedAccountInfos: NonImportedAccountInfo[];
  },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    let hasChanges = false;

    // let's figure out the new local accounts
    const added: AccountDescriptor[] = [];
    const distantServerAccountIds = new Set<string>(latestState?.map(a => a.id) || []);
    for (const account of localData.list) {
      const id = account.id;
      if (!distantServerAccountIds.has(id)) {
        added.push({
          id,
          currencyId: account.currency.id,
          freshAddress: account.freshAddress,
          seedIdentifier: account.seedIdentifier,
          derivationMode: account.derivationMode,
          index: account.index,
        });
        hasChanges = true;
      }
    }

    // let's figure out the locally deleted accounts that we will need to take into account
    const removed = new Set();
    const localAccountIds = new Set(localData.list.map(a => a.id));
    const nonImportedAccountInfos = new Set(localData.nonImportedAccountInfos.map(a => a.id));
    for (const id of distantServerAccountIds) {
      if (!localAccountIds.has(id) && !nonImportedAccountInfos.has(id)) {
        removed.add(id);
        hasChanges = true;
      }
    }

    let nextState = latestState || [];
    if (hasChanges) {
      // we can now build the new state. we apply the diff on top of the previous state
      nextState = [];
      for (const account of latestState || []) {
        if (removed.has(account.id)) {
          continue;
        }
        nextState.push(account);
      }
      // append added
      for (const account of added) {
        nextState.push(account);
      }
    }

    return {
      hasChanges,
      nextState,
    };
  },

  async resolveIncrementalUpdate(ctx, localData, latestState, incomingState) {
    if (!incomingState) {
      return { hasChanges: false }; // nothing to do, the data is no longer available
    }

    const diff = diffWalletSyncState(latestState, incomingState);

    const existingIds = new Set(localData.list.map(a => a.id));

    let hasChanges = false;

    // non imported accounts are considered as "added" so we have opportunity to recheck them
    const nonImportedById = new Map<string, NonImportedAccountInfo>();
    const nextNonImportedById = new Map<string, NonImportedAccountInfo>();
    for (const nonImported of localData.nonImportedAccountInfos) {
      nonImportedById.set(nonImported.id, nonImported);
      const { id, attempts, attemptsLastTimestamp } = nonImported;
      if (existingIds.has(id)) {
        hasChanges = true; // at least we need to save the deletion
        continue; // we actually have the account. ignore.
      }
      const accountDescriptor = incomingState.find(a => a.id === id);
      if (!accountDescriptor) {
        hasChanges = true; // at least we need to save the deletion
        // we don't have the account anymore in the distant state. ignore.
        continue;
      }
      const now = Date.now();
      const shouldRetry = shouldRetryImportAccount(now - attemptsLastTimestamp, attempts);
      if (shouldRetry) {
        diff.added.push(accountDescriptor);
      } else {
        // we don't retry so we preserve the non imported account for the future
        nextNonImportedById.set(id, nonImported);
      }
    }

    // filter out accounts we may already have
    diff.added = diff.added.filter(a => !existingIds.has(a.id));

    const resolved = await resolveWalletSyncDiffIntoSyncUpdate(existingIds, diff, ctx);

    for (const failedId in resolved.failures) {
      const nonImported = nonImportedById.get(failedId);
      const { error } = resolved.failures[failedId];
      hasChanges = true;
      nextNonImportedById.set(failedId, {
        id: failedId,
        attempts: (nonImported?.attempts || 0) + 1,
        attemptsLastTimestamp: Date.now(),
        error: {
          name: error.name,
          message: error.message,
        },
      });
    }

    if (!hasChanges) {
      if (resolved.added.length > 0) {
        hasChanges = true;
      } else if (resolved.removed.length > 0) {
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      // nothing to do
      return { hasChanges };
    }

    return {
      hasChanges: true,
      update: {
        removed: resolved.removed,
        added: resolved.added,
        nonImportedAccountInfos: Array.from(nextNonImportedById.values()),
      },
    };
  },

  applyUpdate(localData, update) {
    const existingIds = new Set(localData.list.map(a => a.id));
    const removed = new Set(update.removed);
    const list = [
      ...localData.list.filter(a => !removed.has(a.id)),
      // filter out data we already have typically if they were added at same time
      ...update.added.filter(a => !existingIds.has(a.id)),
    ];
    const nonImportedAccountInfos = update.nonImportedAccountInfos;
    return { list, nonImportedAccountInfos };
  },
};

export type WalletSyncDiff = {
  hasChanges: boolean;
  added: AccountDescriptor[]; // NB: what's considered "added" is based on the id. we assume all other fields of AccountDescriptor are not relevant for diffing
  removed: string[];
};

export function diffWalletSyncState(
  currentState: AccountDescriptor[] | null,
  newState: AccountDescriptor[],
): WalletSyncDiff {
  const added: AccountDescriptor[] = [];
  const removed: string[] = [];
  const existingIds = new Set<string>();
  if (currentState) {
    for (const { id } of currentState) {
      existingIds.add(id);
    }
  }
  if (newState) {
    const nextIds = new Set<string>();
    for (const data of newState) {
      nextIds.add(data.id);
      if (!existingIds.has(data.id)) {
        added.push(data);
      }
    }
    for (const id of existingIds) {
      if (!nextIds.has(id)) {
        removed.push(id);
      }
    }
  }
  const hasChanges = added.length > 0 || removed.length > 0;
  return { added, removed, hasChanges };
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
  added: Account[];
  removed: string[];
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
  existingIds: Set<string>,
  diff: WalletSyncDiff,
  { getAccountBridge, bridgeCache, blacklistedTokenIds }: WalletSyncDataManagerResolutionContext,
): Promise<WalletSyncAccountsUpdate> {
  const failures: WalletSyncAccountsUpdate["failures"] = {};

  let added = (
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

  const addedIds = new Set(added.map(a => a.id));

  // if some of the account ends up resolving one of the removed, we need to clean it up, this is the case if there were an implicit migration of account ids
  const removed = diff.removed.filter(id => !addedIds.has(id));

  // if some of the resolved are converging to the same account.id, we also remove them out
  added = added.filter(a => !existingIds.has(a.id));

  return { removed, added, failures };
}

const MINUTE = 60 * 1000;
const backoffFactor = 1.3;
const baseWaitTime = 0.5 * MINUTE; // Base wait time in milliseconds
const maxWaitTime = 120 * MINUTE; // Maximum wait time in milliseconds
export function shouldRetryImportAccount(elapsedMs: number, attempts: number) {
  // Calculate the wait time using exponential backoff
  let waitTime = baseWaitTime * Math.pow(backoffFactor, attempts - 1);
  // Clamp the wait time to the maximum value
  waitTime = Math.min(waitTime, maxWaitTime);
  return elapsedMs > waitTime;
}

export default manager;
