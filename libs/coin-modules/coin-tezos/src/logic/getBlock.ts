import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  fetchBlockDelegations,
  fetchBlockStaking,
  fetchBlockTokenTransfers,
  fetchBlockTransactions,
  tzkt,
} from "../network";
import { STAKING_ACTION_TO_OP_TYPE } from "../constants";
import type {
  APIBlock,
  APIDelegationType,
  APIStakingType,
  APITokenTransfer,
  APITransactionType,
} from "../network/types";

const NATIVE_ASSET: AssetInfo = { type: "native", name: "XTZ" };

// ---------------------------------------------------------------------------
// Block-info mapping
// ---------------------------------------------------------------------------

function mapBlockInfo(block: APIBlock, parentBlock: APIBlock): BlockInfo {
  return {
    height: block.level,
    hash: block.hash,
    time: new Date(block.timestamp),
    parent: { height: parentBlock.level, hash: parentBlock.hash },
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
      sum + BigInt(op.bakerFee ?? 0) + BigInt(op.storageFee ?? 0) + BigInt(op.allocationFee ?? 0),
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
        ...(toAddr && { peer: toAddr }),
        asset: NATIVE_ASSET,
        amount: -BigInt(tx.amount),
      });
    }
    if (toAddr) {
      ops.push({
        type: "transfer",
        address: toAddr,
        ...(fromAddr && { peer: fromAddr }),
        asset: NATIVE_ASSET,
        amount: BigInt(tx.amount),
      });
    }
  }
  return ops;
}

// ---------------------------------------------------------------------------
// Delegation helpers
// ---------------------------------------------------------------------------

function computeDelegationFees(op: APIDelegationType): bigint {
  return BigInt(op.bakerFee ?? 0) + BigInt(op.storageFee ?? 0) + BigInt(op.allocationFee ?? 0);
}

function buildDelegationOperations(op: APIDelegationType): BlockOperation[] {
  const senderAddr = op.sender?.address;
  if (!senderAddr) return [];

  const targetAddr = op.newDelegate?.address || op.prevDelegate?.address;
  const isDelegate = !!op.newDelegate?.address;

  return [
    {
      type: "other",
      address: senderAddr,
      asset: NATIVE_ASSET,
      amount: 0n,
      details: {
        operationType: isDelegate ? "DELEGATE" : "UNDELEGATE",
        stakedAmount: 0n,
        ...(targetAddr && { delegate: targetAddr }),
        counter: op.counter,
        gasLimit: op.gasLimit,
        storageLimit: op.storageLimit,
        ledgerOpType: isDelegate ? "DELEGATE" : "UNDELEGATE",
      },
    },
  ];
}

function buildBlockTransactionFromDelegation(op: APIDelegationType): BlockTransaction | null {
  if (!op.hash) return null;

  const feesPayer = op.sender?.address;
  const succeeded = !op.status || op.status === "applied";
  return {
    hash: op.hash,
    failed: !succeeded,
    fees: computeDelegationFees(op),
    ...(feesPayer && { feesPayer }),
    operations: succeeded ? buildDelegationOperations(op) : [],
  };
}

// ---------------------------------------------------------------------------
// Staking helpers (Paris adaptive issuance)
// ---------------------------------------------------------------------------

function computeStakingFees(op: APIStakingType): bigint {
  return BigInt(op.bakerFee ?? 0) + BigInt(op.storageFee ?? 0) + BigInt(op.allocationFee ?? 0);
}

function buildStakingOperations(op: APIStakingType): BlockOperation[] {
  const senderAddr = op.sender?.address;
  if (!senderAddr) return [];

  const operationType = STAKING_ACTION_TO_OP_TYPE[op.action];
  const bakerAddr = op.baker?.address;

  return [
    {
      type: "other",
      address: senderAddr,
      asset: NATIVE_ASSET,
      amount: 0n,
      details: {
        operationType,
        stakedAmount: BigInt(op.amount ?? 0),
        ...(bakerAddr && { delegate: bakerAddr }),
        counter: op.counter,
        gasLimit: op.gasLimit,
        storageLimit: op.storageLimit,
        ledgerOpType: operationType,
      },
    },
  ];
}

function buildBlockTransactionFromStaking(op: APIStakingType): BlockTransaction | null {
  if (!op.hash) return null;

  const feesPayer = op.sender?.address;
  const succeeded = !op.status || op.status === "applied";
  return {
    hash: op.hash,
    failed: !succeeded,
    fees: computeStakingFees(op),
    ...(feesPayer && { feesPayer }),
    operations: succeeded ? buildStakingOperations(op) : [],
  };
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

  // For FA2, multiple token IDs coexist under one contract address.
  // Encoding both as "address:tokenId" makes every token uniquely identifiable.
  // FA1.2 tokens always have tokenId "0", so this format is safe for both standards.
  const tokenId = transfer.token.tokenId ?? "0";
  const asset: AssetInfo = {
    type: "token",
    assetReference: `${transfer.token.contract.address}:${tokenId}`,
    name: transfer.token.metadata?.name ?? transfer.token.metadata?.symbol,
  };

  const fromAddr = transfer.from?.address;
  const toAddr = transfer.to?.address;
  const ops: BlockOperation[] = [];

  if (fromAddr) {
    ops.push({
      type: "transfer",
      address: fromAddr,
      ...(toAddr && { peer: toAddr }),
      asset,
      amount: -tokenAmount,
    });
  }
  if (toAddr) {
    ops.push({
      type: "transfer",
      address: toAddr,
      ...(fromAddr && { peer: fromAddr }),
      asset,
      amount: tokenAmount,
    });
  }
  return ops;
}

// ---------------------------------------------------------------------------
// Transaction grouping — private helpers
// ---------------------------------------------------------------------------

/** Groups native XTZ transactions by their operation hash. */
function groupTransactionsByHash(
  transactions: APITransactionType[],
): Map<string, APITransactionType[]> {
  const groups = new Map<string, APITransactionType[]>();
  for (const tx of transactions) {
    if (!tx.hash) continue;
    const existing = groups.get(tx.hash);
    if (existing) existing.push(tx);
    else groups.set(tx.hash, [tx]);
  }
  return groups;
}

/** Builds a `BlockTransaction` from a group of ops that share the same hash. */
function buildBlockTransactionFromGroup(
  hash: string,
  group: APITransactionType[],
): BlockTransaction {
  const succeeded = isGroupSucceeded(group);
  const blockTx: BlockTransaction = {
    hash,
    failed: !succeeded,
    fees: computeFees(group),
    operations: succeeded ? buildNativeOperations(group) : [],
  };
  const feesPayer = findFeesPayer(group);
  if (feesPayer) blockTx.feesPayer = feesPayer;
  return blockTx;
}

/**
 * Attaches a single FA token transfer to the appropriate `BlockTransaction`.
 *
 * When the transfer's parent native tx is found (via `transactionId → hash`),
 * the token ops are appended to it (unless it failed).  Otherwise a standalone
 * entry is created or extended in `standaloneByKey`, grouped by `transactionId`
 * so that sibling transfers from the same on-chain operation share one entry.
 */
function attachTokenTransfer(
  transfer: APITokenTransfer,
  txIdToHash: Map<number, string>,
  blockTxByHash: Map<string, BlockTransaction>,
  standaloneByKey: Map<string, BlockTransaction>,
): void {
  const tokenOps = buildTokenOperations(transfer);
  if (tokenOps.length === 0) return;

  const parentHash =
    transfer.transactionId === undefined ? undefined : txIdToHash.get(transfer.transactionId);

  if (parentHash !== undefined && blockTxByHash.has(parentHash)) {
    const parent = blockTxByHash.get(parentHash)!;
    if (!parent.failed) parent.operations.push(...tokenOps);
    return;
  }

  // No matching native tx: protocol-level mint/burn or origination-triggered transfer.
  const key =
    transfer.transactionId === undefined
      ? `token-${transfer.id}`
      : `txid-${transfer.transactionId}`;

  const existing = standaloneByKey.get(key);
  if (existing) {
    existing.operations.push(...tokenOps);
  } else {
    standaloneByKey.set(key, {
      hash: key,
      failed: false,
      fees: 0n,
      operations: tokenOps,
    });
  }
}

// ---------------------------------------------------------------------------
// Transaction grouping — public orchestrator
// ---------------------------------------------------------------------------

function mergeAuxiliaryTx(
  blockTxByHash: Map<string, BlockTransaction>,
  auxTx: BlockTransaction,
): void {
  const existing = blockTxByHash.get(auxTx.hash);
  if (!existing) {
    blockTxByHash.set(auxTx.hash, auxTx);
    return;
  }

  if (auxTx.failed) {
    existing.failed = true;
    existing.operations = [];
  } else if (!existing.failed && auxTx.operations.length > 0) {
    existing.operations.push(...auxTx.operations);
  }
  existing.fees += auxTx.fees;
}

function groupAndMapTransactions(
  transactions: APITransactionType[],
  tokenTransfers: APITokenTransfer[],
  delegations: APIDelegationType[],
  stakings: APIStakingType[],
): BlockTransaction[] {
  const groups = groupTransactionsByHash(transactions);

  const txIdToHash = new Map<number, string>();
  for (const tx of transactions) {
    if (tx.id && tx.hash) txIdToHash.set(tx.id, tx.hash);
  }

  const blockTxByHash = new Map<string, BlockTransaction>();
  for (const [hash, group] of groups) {
    blockTxByHash.set(hash, buildBlockTransactionFromGroup(hash, group));
  }

  for (const delegation of delegations) {
    const delegationTx = buildBlockTransactionFromDelegation(delegation);
    if (delegationTx) mergeAuxiliaryTx(blockTxByHash, delegationTx);
  }

  for (const staking of stakings) {
    const stakingTx = buildBlockTransactionFromStaking(staking);
    if (stakingTx) mergeAuxiliaryTx(blockTxByHash, stakingTx);
  }

  const standaloneByKey = new Map<string, BlockTransaction>();
  for (const transfer of tokenTransfers) {
    attachTokenTransfer(transfer, txIdToHash, blockTxByHash, standaloneByKey);
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
 * - Fetches block metadata, native transactions, delegations, FA token transfers, and staking operations in parallel.
 * - Also fetches the predecessor block in parallel to populate `BlockInfo.parent`.
 * - Groups operations by hash, aggregates fees, and determines the fee payer.
 * - Appends FA token transfer operations to the owning BlockTransaction when a
 *   matching `transactionId` can be resolved; otherwise creates a standalone entry.
 */
export async function getBlock(height: number): Promise<Block> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlock: height must be a positive integer, got ${height}`);
  }

  const [block, parentBlock, transactions, tokenTransfers, delegations, stakings] =
    await Promise.all([
      tzkt.getBlockByLevel(height),
      tzkt.getBlockByLevel(height - 1),
      fetchBlockTransactions(height),
      fetchBlockTokenTransfers(height),
      fetchBlockDelegations(height),
      fetchBlockStaking(height),
    ]);

  return {
    info: mapBlockInfo(block, parentBlock),
    transactions: groupAndMapTransactions(transactions, tokenTransfers, delegations, stakings),
  };
}
