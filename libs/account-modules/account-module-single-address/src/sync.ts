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
import type { Balance, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { UnexpectedGetBalanceError } from "@ledgerhq/coin-module-framework/errors";
import { isFailedIncoming, isSequenceTaken, nextHeight, toAccountOperation } from "./operations";
import { walkPages } from "./pages";
import { storedState, versioned } from "./state";
import type {
  SingleAddressAccountModuleOptions,
  SingleAddressAccountState,
  SingleAddressCoinModule,
  SingleAddressScope,
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
 * Refreshes the scopes of an account, then puts the new state into `account.state`: the balances
 * and the stakes are read again whole; the operations are listed above the highest block of the
 * history (from height 0 when no refresh of them completed) and written once every page is read:
 * the next refresh resumes above the highest one written, so the rest of an interrupted listing
 * would be skipped for good. A sync is the refresh of every scope.
 */
export function createRefresh(
  coinModule: SyncCoinModule,
  {
    includeStakes = false,
    optimisticExpiryMs = DEFAULT_OPTIMISTIC_EXPIRY_MS,
    now = Date.now,
    balanceOptions,
  }: SingleAddressAccountModuleOptions = {},
) {
  /** The scopes of the module: the stakes with `includeStakes` only. */
  const scopes: readonly SingleAddressScope[] = includeStakes
    ? ["balances", "stakes", "operations"]
    : ["balances", "operations"];

  /** A failure is wrapped as the bridge's legacy path wraps it, its cause kept. */
  async function readBalances(context: Context<any>, address: string): Promise<Balance[]> {
    try {
      return await (balanceOptions
        ? coinModule.getBalance(context, address, balanceOptions)
        : coinModule.getBalance(context, address));
    } catch (error) {
      throw new UnexpectedGetBalanceError("", error);
    }
  }

  async function readStakes(context: Context<any>, address: string): Promise<Stake[]> {
    const stakes: Stake[] = [];
    const pages = walkPages(cursor =>
      coinModule.getStakes(context, address, cursor ? { cursor } : {}),
    );
    for await (const page of pages) stakes.push(...page.items);
    return stakes;
  }

  async function* refresh(
    context: Context<any>,
    { descriptor, state, history }: AccountData<SingleAddressAccountState>,
    refreshed: readonly SingleAddressScope[],
    signal?: AbortSignal,
  ): AsyncIterable<SyncEvent> {
    signal?.throwIfAborted();
    const has = (scope: SingleAddressScope) => refreshed.includes(scope);
    const previous = await storedState(state);
    const known = has("operations") ? await readHistory(history) : [];
    const minHeight = previous.syncedHeight > 0 ? nextHeight(known) : 0;
    // The tip and the balances first, together, as the bridge reads them: a balance read the
    // region refuses fails the sync before any listing does.
    const [tip, balances, stakes] = await Promise.all([
      has("operations") ? coinModule.lastBlock(context) : undefined,
      has("balances") ? readBalances(context, descriptor.key) : undefined,
      has("stakes") ? readStakes(context, descriptor.key) : undefined,
    ]);
    signal?.throwIfAborted();

    const operations: AccountOperation[] = [];
    if (tip) {
      const pages = walkPages(cursor =>
        coinModule.listOperations(context, descriptor.key, { minHeight, cursor, order: "desc" }),
      );
      for await (const page of pages) {
        signal?.throwIfAborted();
        operations.push(...page.items.filter(op => !isFailedIncoming(op)).map(toAccountOperation));
        yield { progress: { counters: { operations: operations.length } } };
      }
      signal?.throwIfAborted();

      if (operations.length > 0) await history.upsert(operations);
      if (minHeight === 0) await removeUnlisted(history, known, operations);
    }
    const at = now();
    if (tip) {
      await settleOptimisticOperations(history, {
        now: at,
        expiryMs: optimisticExpiryMs,
        isSettled: isSequenceTaken,
      });
    }

    await state.put(
      versioned({
        syncedHeight: tip?.height ?? previous.syncedHeight,
        balances: balances?.map(toJsonBalance) ?? previous.balances,
        stakes: stakes?.map(toJsonStake) ?? previous.stakes,
        refreshedAt: {
          balances: balances ? at : previous.refreshedAt.balances,
          stakes: stakes ? at : previous.refreshedAt.stakes,
          operations: tip ? at : previous.refreshedAt.operations,
        },
      }),
    );
    yield {
      progress: tip ? { blockHeight: tip.height, counters: { operations: operations.length } } : {},
    };
  }

  return { scopes, refresh };
}
