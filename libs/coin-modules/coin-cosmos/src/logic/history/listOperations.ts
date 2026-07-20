import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { CosmosAPI } from "../../network/Cosmos";
import { toOperationExtraRaw } from "../../serialization";
import { txToOps } from "../../synchronisation";
import { CosmosOperation, CosmosTx } from "../../types";

// Default page size when the caller gives no limit — bounds the fetch instead of the full history.
const PAGE_SIZE = 100;

function toOperation(op: CosmosOperation): Operation {
  const details = toOperationExtraRaw(op.extra ?? {}) as Record<string, unknown>;
  return {
    id: op.id,
    type: op.type,
    senders: op.senders,
    recipients: op.recipients,
    value: BigInt(op.value.integerValue().toFixed()),
    // Single-asset module — every op reported native (IBC/token denoms not surfaced).
    asset: { type: "native" },
    ...(Object.keys(details).length > 0 ? { details } : {}),
    tx: {
      hash: op.hash,
      block: {
        height: op.blockHeight ?? 0,
        hash: "", // block hash is not returned by the tx-list endpoint
        time: op.date,
      },
      fees: BigInt(op.fee.integerValue().toFixed()),
      date: op.date,
      failed: Boolean((op as CosmosOperation & { hasFailed?: boolean }).hasFailed),
    },
  };
}

/**
 * Paginated operation history. The cursor is a transaction-space offset, not op-space: `txToOps`
 * drops unknown message types, so an op-space offset would outrun the ops and skip txs.
 */
export async function listOperations(
  api: CosmosAPI,
  address: string,
  currencyId: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  // Backend pages newest-first with a forward-only cursor, so asc can't be honored across pages.
  if (options.order === "asc") {
    throw new Error("ascending order is not supported");
  }

  const currency = getCryptoCurrencyById(currencyId);
  const accountId = `js:2:${currencyId}:${address}:`;
  const info = { address, currency } as unknown as Parameters<typeof txToOps>[0];

  const offset = options.cursor ? Math.max(0, Number.parseInt(options.cursor, 10) || 0) : 0;
  const limit = options.limit ?? PAGE_SIZE;
  // offset+limit per stream: the merged top-N is a subset of each stream's top-N, so it's the exact page.
  const count = offset + limit;

  const { txs, hasMore } = await api.getTransactionsPage(address, count);

  // sender + recipient streams overlap, so dedupe on tx hash.
  const deduped = new Map<string, CosmosTx>();
  for (const tx of txs) {
    if (!deduped.has(tx.txhash)) {
      deduped.set(tx.txhash, tx);
    }
  }
  const uniqueTxs = [...deduped.values()];

  // A raw tx below minHeight means we've paged past the floor — nothing older remains to fetch.
  const reachedFloor = uniqueTxs.some(tx => Number(tx.height) < options.minHeight);

  const sortedTxs = uniqueTxs
    .filter(tx => Number(tx.height) >= options.minHeight)
    .sort((a, b) => {
      const diff = Number(a.height) - Number(b.height);
      if (diff !== 0) return -diff; // newest first
      // Tie-break equal heights by hash so the order is deterministic across re-fetches.
      if (a.txhash < b.txhash) return -1;
      if (a.txhash > b.txhash) return 1;
      return 0;
    });

  // Slice in tx-space, then parse — a drop shortens a page but never skips.
  const items = txToOps(info, accountId, sortedTxs.slice(offset, offset + limit)).map(toOperation);
  // Key `next` on the floor, not page fullness, so a short page from parse-drops still advances.
  const next =
    offset + limit < sortedTxs.length || (hasMore && !reachedFloor)
      ? String(offset + limit)
      : undefined;

  return { items, next };
}
