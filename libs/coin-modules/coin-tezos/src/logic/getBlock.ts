import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { fetchBlockTokenTransfers, fetchBlockTransactions, tzkt } from "../network";
import type { APIBlock, APITokenTransfer, APITransactionType } from "../network/types";

const NATIVE_ASSET: AssetInfo = { type: "native", name: "XTZ" };

// ---------------------------------------------------------------------------
// Block-info mapping
// ---------------------------------------------------------------------------

function mapBlockInfo(block: APIBlock): BlockInfo {
  return {
    height: block.level,
    hash: block.hash,
    time: new Date(block.timestamp),
  };
}

// ---------------------------------------------------------------------------
// Native XTZ helpers
// ---------------------------------------------------------------------------

/**
 * Computes the total fees for an operation group (all ops sharing the same hash).
 *
 * In Tezos, `bakerFee` is charged only on the top-level op, but `storageFee` and
 * `allocationFee` can appear on internal ops emitted by contracts as well.
 */
function computeFees(group: APITransactionType[]): bigint {
  return group.reduce(
    (sum, op) =>
      sum +
      BigInt(op.bakerFee ?? 0) +
      BigInt(op.storageFee ?? 0) +
      BigInt(op.allocationFee ?? 0),
    0n,
  );
}

/**
 * Determines who paid the fees for an operation group.
 *
 * The fee payer is the top-level op's `initiator` (when a contract triggered the
 * call) or its `sender` (for direct user operations).  The "top-level" op is the
 * one that carries a non-zero `bakerFee`; if none exists we fall back to the first
 * op in the group.
 */
function findFeesPayer(group: APITransactionType[]): string | undefined {
  const topLevelOp = group.find(op => (op.bakerFee ?? 0) > 0) ?? group[0];
  return topLevelOp?.initiator?.address ?? topLevelOp?.sender?.address;
}

/**
 * Returns `true` only when every op in the group succeeded.
 *
 * Tezos can partially execute a batch (later ops get "backtracked"), so we treat
 * the whole group as failed if any op did not reach "applied" status.  Fees are
 * still charged in that case, but no balance changes took effect.
 */
function isGroupSucceeded(group: APITransactionType[]): boolean {
  return group.every(op => !op.status || op.status === "applied");
}

/**
 * Produces one outgoing and one incoming `BlockOperation` for each non-zero XTZ
 * transfer within the group.
 *
 * Fees are intentionally excluded from amounts — they are reported separately in
 * `BlockTransaction.fees`.  In Tezos, the `amount` field on `APITransactionType`
 * already represents only the transferred value, so no adjustment is required
 * (unlike XRPL, where the raw balance diff includes the fee deduction).
 */
function buildNativeOperations(group: APITransactionType[]): BlockOperation[] {
  const ops: BlockOperation[] = [];
  for (const tx of group) {
    if (!tx.amount) continue;

    const fromAddr = tx.sender?.address;
    const toAddr = tx.target?.address;

    if (fromAddr) {
      ops.push({
        type: "transfer",
        address: fromAddr,
        peer: toAddr,
        asset: NATIVE_ASSET,
        amount: -BigInt(tx.amount),
      });
    }
    if (toAddr) {
      ops.push({
        type: "transfer",
        address: toAddr,
        peer: fromAddr,
        asset: NATIVE_ASSET,
        amount: BigInt(tx.amount),
      });
    }
  }
  return ops;
}

// ---------------------------------------------------------------------------
// FA token helpers
// ---------------------------------------------------------------------------

/**
 * Produces outgoing / incoming `BlockOperation` entries for a single FA transfer.
 *
 * Minting events (`from` absent) produce only the incoming entry; burning events
 * (`to` absent) produce only the outgoing entry.
 */
function buildTokenOperations(transfer: APITokenTransfer): BlockOperation[] {
  const tokenAmount = BigInt(transfer.amount);
  if (tokenAmount === 0n) return [];

  const asset: AssetInfo = {
    type: "token",
    assetReference: transfer.token.contract.address,
    name: transfer.token.metadata?.name ?? transfer.token.metadata?.symbol,
  };

  const fromAddr = transfer.from?.address;
  const toAddr = transfer.to?.address;
  const ops: BlockOperation[] = [];

  if (fromAddr) {
    ops.push({ type: "transfer", address: fromAddr, peer: toAddr, asset, amount: -tokenAmount });
  }
  if (toAddr) {
    ops.push({ type: "transfer", address: toAddr, peer: fromAddr, asset, amount: tokenAmount });
  }
  return ops;
}

// ---------------------------------------------------------------------------
// Transaction grouping
// ---------------------------------------------------------------------------

function groupAndMapTransactions(
  transactions: APITransactionType[],
  tokenTransfers: APITokenTransfer[],
): BlockTransaction[] {
  // ── Step 1: group native XTZ transactions by operation hash ──────────────
  const groups = new Map<string, APITransactionType[]>();
  for (const tx of transactions) {
    if (!tx.hash) continue;
    const existing = groups.get(tx.hash);
    if (existing) {
      existing.push(tx);
    } else {
      groups.set(tx.hash, [tx]);
    }
  }

  // ── Step 2: build TzKT operation id → hash lookup (for FA transfer join) ─
  const txIdToHash = new Map<number, string>();
  for (const tx of transactions) {
    if (tx.id && tx.hash) txIdToHash.set(tx.id, tx.hash);
  }

  // ── Step 3: map each group into a BlockTransaction ────────────────────────
  const blockTxByHash = new Map<string, BlockTransaction>();
  for (const [hash, group] of groups) {
    const succeeded = isGroupSucceeded(group);
    const blockTx: BlockTransaction = {
      hash,
      failed: !succeeded,
      fees: computeFees(group),
      operations: succeeded ? buildNativeOperations(group) : [],
    };
    const feesPayer = findFeesPayer(group);
    if (feesPayer) blockTx.feesPayer = feesPayer;
    blockTxByHash.set(hash, blockTx);
  }

  // ── Step 4: attach FA token operations ───────────────────────────────────
  // Protocol-level / implicit transfers that have no matching native tx are
  // collected into standalone BlockTransactions, grouped by transactionId so
  // that multiple token transfers from the same parent op share one entry.
  const standaloneByKey = new Map<string, BlockTransaction>();

  for (const transfer of tokenTransfers) {
    const tokenOps = buildTokenOperations(transfer);
    if (tokenOps.length === 0) continue;

    const parentHash =
      transfer.transactionId !== undefined
        ? txIdToHash.get(transfer.transactionId)
        : undefined;

    if (parentHash !== undefined && blockTxByHash.has(parentHash)) {
      // Successful parent tx: append token ops (failed parents have no real balance changes)
      const parent = blockTxByHash.get(parentHash)!;
      if (!parent.failed) {
        parent.operations.push(...tokenOps);
      }
    } else {
      // No matching native tx (protocol-level mint/burn or origination-triggered transfer).
      // Group by transactionId when available so sibling transfers share one entry.
      const key =
        transfer.transactionId !== undefined
          ? `txid-${transfer.transactionId}`
          : `token-${transfer.id}`;

      const existing = standaloneByKey.get(key);
      if (existing) {
        existing.operations.push(...tokenOps);
      } else {
        standaloneByKey.set(key, {
          hash: parentHash ?? "",
          failed: false,
          fees: 0n,
          operations: tokenOps,
        });
      }
    }
  }

  return [...blockTxByHash.values(), ...standaloneByKey.values()];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the full block at the given Tezos level: metadata + all transactions
 * with their XTZ and FA token balance changes.
 *
 * Mirrors the XRP `getBlock` contract:
 * - Returns an empty sentinel block for `height <= 0` without hitting the network.
 * - Fetches block metadata, native transactions, and FA token transfers in parallel.
 * - Groups operations by hash, aggregates fees, and determines the fee payer.
 * - Appends FA token transfer operations to the owning BlockTransaction when a
 *   matching `transactionId` can be resolved; otherwise creates a standalone entry.
 */
export async function getBlock(height: number): Promise<Block> {
  if (height <= 0) {
    return { info: { height, hash: "", time: new Date(0) }, transactions: [] };
  }

  const [block, transactions, tokenTransfers] = await Promise.all([
    tzkt.getBlockByLevel(height),
    fetchBlockTransactions(height),
    fetchBlockTokenTransfers(height),
  ]);

  return {
    info: mapBlockInfo(block),
    transactions: groupAndMapTransactions(transactions, tokenTransfers),
  };
}
