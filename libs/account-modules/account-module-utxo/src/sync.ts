import {
  compareNewestFirst,
  readHistory,
  settleOptimisticOperations,
  type AccountData,
  type AccountOperation,
  type SyncEvent,
} from "@ledgerhq/account-module-framework";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { deriverOf, displayOf } from "./addresses";
import { inputsOf, txToOperations } from "./interpret";
import { emptyState, readState, versioned } from "./state";
import type {
  UtxoAccountModuleOptions,
  UtxoAccountState,
  UtxoAddressState,
  UtxoCoinModuleApi,
  UtxoTransaction,
} from "./types";
import { applyTransactions, reconcile } from "./utxos";

export type SyncSettings = Required<
  Pick<
    UtxoAccountModuleOptions,
    "receiveChain" | "changeChain" | "gapLimit" | "rewindBlocks" | "now"
  >
> &
  Pick<UtxoAccountModuleOptions, "replacedOperationExpiryMs">;

/** Every transaction of an address from `minHeight`, mempool included, confirmed preferred. */
async function fetchTransactions(
  api: UtxoCoinModuleApi,
  context: Context<any>,
  address: string,
  minHeight: number,
): Promise<UtxoTransaction[]> {
  const byId = new Map<string, UtxoTransaction>();
  let cursor: string | undefined;
  do {
    const page = await api.listAddressTransactions(context, address, {
      minHeight,
      order: "asc",
      ...(cursor ? { cursor } : {}),
    });
    for (const tx of page.items) keepConfirmed(byId, tx);
    cursor = page.next && page.next !== cursor ? page.next : undefined;
  } while (cursor);
  return [...byId.values()];
}

function keepConfirmed(byId: Map<string, UtxoTransaction>, tx: UtxoTransaction): void {
  const known = byId.get(tx.id);
  if (!known || (!known.block && tx.block)) byId.set(tx.id, tx);
}

/** An anchor that cannot be checked is not a reorg: a failing lookup must not wipe the account. */
async function isReorged(
  api: UtxoCoinModuleApi,
  context: Context<any>,
  anchor: NonNullable<UtxoAccountState["anchor"]>,
): Promise<boolean> {
  try {
    const block = await api.getBlockInfo(context, anchor.height);
    return block.hash !== anchor.hash;
  } catch {
    return false;
  }
}

const highestBlock = (
  anchor: UtxoAccountState["anchor"],
  transactions: UtxoTransaction[],
): UtxoAccountState["anchor"] =>
  transactions.reduce<UtxoAccountState["anchor"]>(
    (best, tx) =>
      tx.block && (!best || tx.block.height > best.height)
        ? { height: tx.block.height, hash: tx.block.hash }
        : best,
    anchor,
  );

const addressesOf = (addresses: UtxoAddressState[], chain?: number): Set<string> =>
  new Set(addresses.filter(a => chain === undefined || a.chain === chain).map(a => a.address));

function mergeById(previous: AccountOperation[], fresh: AccountOperation[]): AccountOperation[] {
  const byId = new Map(previous.map(op => [op.id, op]));
  for (const op of fresh) byId.set(op.id, op);
  return [...byId.values()];
}

/**
 * Walks the address chains of the account key up to a gap of unused addresses, reads the history
 * of each address from the coin module, and interprets every transaction once against the whole
 * address set. Resumes `rewindBlocks` below the last synced tip; starts over on a reorg.
 */
export async function* syncAccount(
  api: UtxoCoinModuleApi,
  settings: SyncSettings,
  context: Context<any>,
  { descriptor, state: persisted, history }: AccountData<UtxoAccountState>,
  signal?: AbortSignal,
): AsyncIterable<SyncEvent<UtxoAccountState>> {
  const derive = deriverOf(api, context, descriptor);
  const display = displayOf(api);
  let state = readState(persisted) ?? emptyState();

  const tip = await api.lastBlock(context);
  if (state.anchor && (await isReorged(api, context, state.anchor))) {
    state = emptyState();
    const synced = (await readHistory(history)).filter(op => !op.optimistic);
    await history.remove(synced.map(op => op.id));
  }
  const fromHeight =
    state.syncedHeight > 0 ? Math.max(0, state.syncedHeight - settings.rewindBlocks) : 0;

  const known = addressesOf(state.addresses);
  const discovered: UtxoAddressState[] = [];
  const fetched = new Map<string, UtxoTransaction>();
  const walkChain = async (chain: number): Promise<void> => {
    for (let start = 0; ; start += settings.gapLimit) {
      signal?.throwIfAborted();
      const used = await Promise.all(
        Array.from({ length: settings.gapLimit }, async (_, offset) => {
          const index = start + offset;
          const address = await derive(chain, index);
          const isKnown = known.has(address);
          const txs = await fetchTransactions(api, context, address, isKnown ? fromHeight : 0);
          if (!isKnown && txs.length > 0) discovered.push({ address, chain, index });
          for (const tx of txs) keepConfirmed(fetched, tx);
          return isKnown || txs.length > 0;
        }),
      );
      if (!used.some(Boolean)) return;
    }
  };
  await Promise.all([settings.receiveChain, settings.changeChain].map(walkChain));

  const addresses = [...state.addresses, ...discovered];
  const own = addressesOf(addresses);
  const change = addressesOf(addresses, settings.changeChain);
  const transactions = [...fetched.values()];
  const confirmed = transactions.filter(tx => tx.block);
  const pending = transactions.filter(tx => !tx.block);
  const counters = { addressesScanned: addresses.length, transactions: transactions.length };
  yield { state: versioned(state), progress: { counters } };

  const previous = (await readHistory(history)).filter(op => !op.optimistic);
  const fresh = transactions.flatMap(tx => txToOperations(tx, own, change, display));
  const merged = mergeById(previous, fresh).sort(compareNewestFirst);
  const confirmedUtxos = applyTransactions(state.confirmedUtxos, confirmed, own);
  const expiryMs = await settings.replacedOperationExpiryMs?.(context);
  const now = settings.now();
  const reconciled = reconcile(
    merged,
    applyTransactions(confirmedUtxos, pending, own),
    now,
    expiryMs,
  );

  const keptIds = new Set(reconciled.operations.map(op => op.id));
  const dropped = merged.filter(op => !keptIds.has(op.id)).map(op => op.id);
  if (dropped.length > 0) await history.remove(dropped);
  const freshIds = new Set(fresh.map(op => op.id));
  await history.upsert(reconciled.operations.filter(op => freshIds.has(op.id)));
  await settleOptimisticOperations(history, {
    now,
    isSettled: (optimistic, synced) => {
      const spentByConfirmed = new Set(synced.filter(op => op.block).flatMap(inputsOf));
      return inputsOf(optimistic).some(input => spentByConfirmed.has(input));
    },
  });

  const next: UtxoAccountState = {
    syncedHeight: tip.height,
    anchor: highestBlock(state.anchor, confirmed),
    addresses,
    confirmedUtxos,
    utxos: reconciled.utxos,
  };
  yield { state: versioned(next), progress: { blockHeight: tip.height, counters } };
}
