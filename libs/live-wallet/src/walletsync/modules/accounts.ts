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

const manager: WalletSyncDataManager<
  {
    list: Account[];
    // TODO there remain a case to solve: when an account failed to be resolved in the past, we would need to eventually retry it. we could do this basically by adding in the resolved the failed
    // wsStateNonImportedAccountIds: string[]; // TODO
  },
  {
    removed: string[];
    added: Account[];
    // wsStateNonImportedAccountIds // TODO
  },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localAccounts, latestState) {
    let hasChanges = false;

    // let's figure out the new local accounts
    const added: AccountDescriptor[] = [];
    const distantServerAccountIds = new Set<string>(latestState?.map(a => a.id) || []);
    for (const account of localAccounts.list) {
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
    const localAccountIds = new Set(localAccounts.list.map(a => a.id));
    for (const id of distantServerAccountIds) {
      if (!localAccountIds.has(id)) {
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

  async resolveIncomingDistantState(ctx, localData, latestState, incomingState) {
    if (!incomingState) {
      return { hasChanges: false }; // nothing to do, the data is no longer available
    }
    // TODO there remain a case to solve: when an account failed to be resolved in the past, we would need to eventually retry it. we could do this basically by adding in the resolved the failed

    const diff = diffWalletSyncState(latestState, incomingState);

    // filter out accounts we may already have
    const existingIds = new Set(localData.list.map(a => a.id));
    diff.added = diff.added.filter(a => !existingIds.has(a.id));

    const resolved = await resolveWalletSyncDiffIntoSyncUpdate(diff, ctx);

    if (
      resolved.added.length === 0 &&
      resolved.removed.length === 0
      // NB at the moment we don't care about failures, when we preserve it, this needs to be a change
      /*&&
      Object.keys(resolved.failures).length === 0
      */
    ) {
      // nothing to do
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      update: {
        removed: resolved.removed,
        added: resolved.added,
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
    // const wsStateNonImportedAccountIds = [];
    return { list }; // , wsStateNonImportedAccountIds };
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
  diff: WalletSyncDiff,
  { getAccountBridge, bridgeCache, blacklistedTokenIds }: WalletSyncDataManagerResolutionContext,
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
    removed: diff.removed,
    added,
    failures,
  };
}

export default manager;
