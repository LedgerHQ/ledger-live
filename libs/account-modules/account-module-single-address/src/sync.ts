import {
  DEFAULT_OPTIMISTIC_EXPIRY_MS,
  readHistory,
  settleOptimisticOperations,
  toJsonBalance,
  toJsonStake,
  type AccountData,
  type AccountOperation,
  type HistoryStore,
  type SyncEvent,
} from "@ledgerhq/account-module-framework";
import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { isFailedIncoming, isSequenceTaken, nextHeight, toAccountOperation } from "./operations";
import { walkPages } from "./pages";
import { emptyState, readState, versioned } from "./state";
import type {
  SingleAddressAccountModuleOptions,
  SingleAddressAccountState,
  SingleAddressCoinModule,
} from "./types";

type SyncCoinModule = Pick<
  SingleAddressCoinModule,
  "lastBlock" | "listOperations" | "getBalance" | "getStakes"
>;

/** A listing from height 0 is the whole truth: what it misses was reorganized, or a past format. */
async function removeUnlisted(
  history: HistoryStore,
  known: AccountOperation[],
  listed: AccountOperation[],
): Promise<void> {
  const listedIds = new Set(listed.map(op => op.id));
  const unlisted = known.filter(op => !op.optimistic && !listedIds.has(op.id));
  if (unlisted.length > 0) await history.remove(unlisted.map(op => op.id));
}

/**
 * The operations are written once every page is read: the next sync resumes above the highest
 * one written, so the rest of an interrupted listing would be skipped for good.
 */
export function createSync(
  coinModule: SyncCoinModule,
  {
    includeStakes = false,
    optimisticExpiryMs = DEFAULT_OPTIMISTIC_EXPIRY_MS,
    now = Date.now,
  }: SingleAddressAccountModuleOptions = {},
) {
  async function readStakes(context: Context<any>, address: string): Promise<Stake[]> {
    const stakes: Stake[] = [];
    const pages = walkPages(cursor =>
      coinModule.getStakes(context, address, cursor ? { cursor } : {}),
    );
    for await (const page of pages) stakes.push(...page.items);
    return stakes;
  }

  return async function* sync(
    context: Context<any>,
    { descriptor, state, history }: AccountData<SingleAddressAccountState>,
    { signal }: { signal?: AbortSignal } = {},
  ): AsyncIterable<SyncEvent<SingleAddressAccountState>> {
    signal?.throwIfAborted();
    const previous = readState(state);
    const unchanged = versioned(previous ?? emptyState());
    const known = await readHistory(history);
    const resumable = previous !== undefined && previous.syncedHeight > 0;
    const minHeight = resumable ? nextHeight(known) : 0;
    const tip = await coinModule.lastBlock(context);

    const operations: AccountOperation[] = [];
    const pages = walkPages(cursor =>
      coinModule.listOperations(context, descriptor.key, { minHeight, cursor }),
    );
    for await (const page of pages) {
      signal?.throwIfAborted();
      operations.push(...page.items.filter(op => !isFailedIncoming(op)).map(toAccountOperation));
      yield { state: unchanged, progress: { counters: { operations: operations.length } } };
    }

    const [balances, stakes] = await Promise.all([
      coinModule.getBalance(context, descriptor.key),
      includeStakes ? readStakes(context, descriptor.key) : [],
    ]);
    signal?.throwIfAborted();

    if (operations.length > 0) await history.upsert(operations);
    if (minHeight === 0) await removeUnlisted(history, known, operations);
    await settleOptimisticOperations(history, {
      now: now(),
      expiryMs: optimisticExpiryMs,
      isSettled: isSequenceTaken,
    });

    yield {
      state: versioned({
        syncedHeight: tip.height,
        balances: balances.map(toJsonBalance),
        stakes: stakes.map(toJsonStake),
      }),
      progress: { blockHeight: tip.height, counters: { operations: operations.length } },
    };
  };
}
