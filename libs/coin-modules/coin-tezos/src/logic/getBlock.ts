import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  fetchBlockDelegations,
  fetchBlockOriginations,
  fetchBlockReveals,
  fetchBlockStaking,
  fetchBlockTokenTransfers,
  fetchBlockTransactions,
  tzkt,
} from "../network";
import { STAKING_ACTION_TO_OP_TYPE } from "../constants";
import type {
  APIBlock,
  APIDelegationType,
  APIOriginationType,
  APIRevealType,
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

/** Computes bakerFee + storageFee + allocationFee for a single operation. */
function computeOpFees(op: {
  bakerFee?: number;
  storageFee?: number;
  allocationFee?: number;
}): bigint {
  return BigInt(op.bakerFee ?? 0) + BigInt(op.storageFee ?? 0) + BigInt(op.allocationFee ?? 0);
}

/**
 * Computes the total fees for an operation group (all ops sharing the same hash).
 *
 * In Tezos, `bakerFee` is charged only on the top-level op, but `storageFee` and
 * `allocationFee` can appear on internal ops emitted by contracts as well.
 */
function computeFees(group: APITransactionType[]): bigint {
  return group.reduce((sum, op) => sum + computeOpFees(op), 0n);
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
 * Produces one outgoing and one incoming `BlockOperation` for each transaction in the group
 * that should be represented in the block.
 *
 * Transactions are skipped only when both the transferred amount and the fees are zero.
 * Fee-only transactions (amount === 0 but fees > 0) are kept so fee attribution and
 * sender/target linkage match `listOperations`.
 *
 * Fees are intentionally excluded from amounts — they are reported separately in
 * `BlockTransaction.fees`.  In Tezos, the `amount` field on `APITransactionType`
 * already represents only the transferred value, so no adjustment is required
 * (unlike XRPL, where the raw balance diff includes the fee deduction).
 */
function buildNativeOperations(group: APITransactionType[]): BlockOperation[] {
  const ops: BlockOperation[] = [];
  for (const tx of group) {
    const amount = BigInt(tx.amount ?? 0);
    if (amount === 0n && computeOpFees(tx) === 0n) continue;

    const fromAddr = tx.sender?.address;
    const toAddr = tx.target?.address;

    if (fromAddr) {
      ops.push({
        type: "transfer",
        address: fromAddr,
        ...(toAddr && { peer: toAddr }),
        asset: NATIVE_ASSET,
        amount: -amount,
      });
    }
    if (toAddr) {
      ops.push({
        type: "transfer",
        address: toAddr,
        ...(fromAddr && { peer: fromAddr }),
        asset: NATIVE_ASSET,
        amount,
      });
    }
  }
  return ops;
}

// ---------------------------------------------------------------------------
// Delegation helpers
// ---------------------------------------------------------------------------

const computeDelegationFees = computeOpFees;

function buildDelegationOperations(op: APIDelegationType): BlockOperation[] {
  const senderAddr = op.sender?.address;
  if (!senderAddr) return [];

  const isDelegate = !!op.newDelegate?.address;

  return [
    {
      type: "other",
      address: senderAddr,
      asset: NATIVE_ASSET,
      amount: 0n,
      ledgerOpType: isDelegate ? "DELEGATE" : "UNDELEGATE",
      stakedAmount: 0n,
      details: {
        counter: op.counter,
        gasLimit: op.gasLimit,
        storageLimit: op.storageLimit,
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

const computeStakingFees = computeOpFees;

function buildStakingOperations(op: APIStakingType): BlockOperation[] {
  const senderAddr = op.sender?.address;
  if (!senderAddr) return [];

  const operationType = STAKING_ACTION_TO_OP_TYPE[op.action];

  return [
    {
      type: "other",
      address: senderAddr,
      asset: NATIVE_ASSET,
      amount: 0n,
      ledgerOpType: operationType,
      stakedAmount: BigInt(op.amount ?? 0),
      details: {
        counter: op.counter,
        gasLimit: op.gasLimit,
        storageLimit: op.storageLimit,
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
// Origination helpers
// ---------------------------------------------------------------------------

const computeOriginationFees = computeOpFees;

function buildOriginationOperations(op: APIOriginationType): BlockOperation[] {
  const senderAddr = op.sender?.address;
  if (!senderAddr) return [];

  return [
    {
      type: "other",
      address: senderAddr,
      asset: NATIVE_ASSET,
      amount: op.contractBalance > 0 ? -BigInt(op.contractBalance) : 0n,
      ledgerOpType: "ORIGINATION",
      details: {
        counter: op.counter,
        gasLimit: op.gasLimit,
        storageLimit: op.storageLimit,
      },
    },
  ];
}

function buildBlockTransactionFromOrigination(op: APIOriginationType): BlockTransaction | null {
  if (!op.hash) return null;

  const feesPayer = op.sender?.address;
  const succeeded = !op.status || op.status === "applied";
  return {
    hash: op.hash,
    failed: !succeeded,
    fees: computeOriginationFees(op),
    ...(feesPayer && { feesPayer }),
    operations: succeeded ? buildOriginationOperations(op) : [],
  };
}

// ---------------------------------------------------------------------------
// Reveal helpers
// ---------------------------------------------------------------------------

const computeRevealFees = computeOpFees;

function buildRevealOperations(op: APIRevealType): BlockOperation[] {
  const senderAddr = op.sender?.address;
  if (!senderAddr) return [];

  return [
    {
      type: "other",
      address: senderAddr,
      asset: NATIVE_ASSET,
      amount: 0n,
      ledgerOpType: "REVEAL",
      details: {
        counter: op.counter,
        gasLimit: op.gasLimit,
        storageLimit: op.storageLimit,
      },
    },
  ];
}

function buildBlockTransactionFromReveal(op: APIRevealType): BlockTransaction | null {
  if (!op.hash) return null;

  const feesPayer = op.sender?.address;
  const succeeded = !op.status || op.status === "applied";
  return {
    hash: op.hash,
    failed: !succeeded,
    fees: computeRevealFees(op),
    ...(feesPayer && { feesPayer }),
    operations: succeeded ? buildRevealOperations(op) : [],
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
    type: transfer.token.standard,
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
    transfer.transactionId !== undefined
      ? txIdToHash.get(transfer.transactionId)
      : transfer.originationId !== undefined
        ? txIdToHash.get(transfer.originationId)
        : undefined;

  if (parentHash !== undefined && blockTxByHash.has(parentHash)) {
    const parent = blockTxByHash.get(parentHash)!;
    if (!parent.failed) parent.operations.push(...tokenOps);
    return;
  }

  // No matching BlockTransaction in this block. Use the resolved parent hash
  // when available (cross-block origination) so the standalone entry carries the
  // real origination hash — matching what listOperations would produce.
  const parentId = transfer.transactionId ?? transfer.originationId;
  const key = parentHash ?? (parentId === undefined ? `token-${transfer.id}` : `txid-${parentId}`);

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

  // When an auxiliary op (reveal, delegation, etc.) failed, we mark the whole
  // merged transaction as failed. This is a modeling choice: the auxiliary op
  // shares the same hash and its failure typically means the batch was aborted.
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
  originations: APIOriginationType[],
  reveals: APIRevealType[],
  crossBlockIdToHash: Map<number, string> = new Map(),
): BlockTransaction[] {
  const groups = groupTransactionsByHash(transactions);

  const txIdToHash = new Map<number, string>();
  for (const tx of transactions) {
    if (tx.id && tx.hash) txIdToHash.set(tx.id, tx.hash);
  }
  for (const orig of originations) {
    if (orig.id && orig.hash) txIdToHash.set(orig.id, orig.hash);
  }
  for (const [id, hash] of crossBlockIdToHash) {
    txIdToHash.set(id, hash);
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

  for (const origination of originations) {
    const originationTx = buildBlockTransactionFromOrigination(origination);
    if (originationTx) mergeAuxiliaryTx(blockTxByHash, originationTx);
  }

  for (const reveal of reveals) {
    const revealTx = buildBlockTransactionFromReveal(reveal);
    if (revealTx) mergeAuxiliaryTx(blockTxByHash, revealTx);
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

  const [
    block,
    parentBlock,
    transactions,
    tokenTransfers,
    delegations,
    stakings,
    originations,
    reveals,
  ] = await Promise.all([
    tzkt.getBlockByLevel(height),
    tzkt.getBlockByLevel(height - 1),
    fetchBlockTransactions(height),
    fetchBlockTokenTransfers(height),
    fetchBlockDelegations(height),
    fetchBlockStaking(height),
    fetchBlockOriginations(height),
    fetchBlockReveals(height),
  ]);

  // Token transfers triggered by originations from other blocks carry an
  // `originationId` that points outside this block's origination set. Resolve
  // those hashes so the token ops attach to the correct parent BlockTransaction
  // instead of becoming orphan `token-{id}` entries.
  const knownIds = new Set([...transactions.map(t => t.id), ...originations.map(o => o.id)]);
  const unresolvedOrigIds = [
    ...new Set(
      tokenTransfers
        .filter(t => t.transactionId === undefined)
        .map(t => t.originationId)
        .filter((id): id is number => id !== undefined && !knownIds.has(id)),
    ),
  ];
  const crossBlockIdToHash = new Map<number, string>();
  if (unresolvedOrigIds.length > 0) {
    const resolved = await tzkt.getOperationsOrigination(0, undefined, {
      "id.in": unresolvedOrigIds.join(","),
    });
    for (const op of resolved) {
      if (op.id && op.hash) crossBlockIdToHash.set(op.id, op.hash);
    }
  }

  return {
    info: mapBlockInfo(block, parentBlock),
    transactions: groupAndMapTransactions(
      transactions,
      tokenTransfers,
      delegations,
      stakings,
      originations,
      reveals,
      crossBlockIdToHash,
    ),
  };
}
