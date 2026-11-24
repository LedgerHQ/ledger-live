import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import type { NearContext } from "../config";
import {
  fetchBlockTransactions,
  fetchIndexedBlock,
  fetchTransactionReceipts,
} from "../network/blockTransactions";
import type { NearReceiptNode, NearTransaction } from "../network/sdk.types";

const transfer = (from: string, to: string, amount: bigint): BlockOperation[] => {
  return [
    { type: "transfer", address: from, peer: to, asset: { type: "native" }, amount: -amount },
    { type: "transfer", address: to, peer: from, asset: { type: "native" }, amount },
  ];
};

// The balance of a deleted account reaches its beneficiary through a receipt sent by `system` with
// the empty public key, unlike the gas refunds, which carry the signer's key and must not be counted
// as movements since fees are already net.
const isDeletionRefund = (node: NearReceiptNode, parent: NearReceiptNode | undefined): boolean => {
  return (
    node.predecessor_account_id === "system" &&
    node.public_key === "ed25519:11111111111111111111111111111111" &&
    parent?.actions.some(
      action =>
        action.action === "DELETE_ACCOUNT" &&
        action.args?.beneficiary_id === node.receiver_account_id,
    ) === true
  );
};

const collectTransfers = (node: NearReceiptNode, parent?: NearReceiptNode): BlockOperation[] => {
  const deletionRefund = isDeletionRefund(node, parent);
  const isMovement =
    node.outcome.status && (node.predecessor_account_id !== "system" || deletionRefund);
  const sender =
    deletionRefund && parent ? parent.receiver_account_id : node.predecessor_account_id;
  const own = isMovement
    ? node.actions.flatMap(action => {
        const deposit = BigInt(action.args?.deposit ?? 0);
        return deposit === 0n ? [] : transfer(sender, node.receiver_account_id, deposit);
      })
    : [];

  return [...own, ...(node.receipts ?? []).flatMap(child => collectTransfers(child, node))];
};

const collectActions = (node: NearReceiptNode): BlockOperation[] => {
  return node.actions
    .filter(action => action.action !== "TRANSFER")
    .map(action => ({
      type: "other",
      actionType: action.action,
      ...(action.method ? { method: action.method } : {}),
    }));
};

const toBlockTransaction = (
  transaction: NearTransaction,
  receipts: NearReceiptNode,
): BlockTransaction => {
  const status = transaction.outcomes?.status;
  const fee = transaction.outcomes_agg?.transaction_fee;

  if (status === undefined || fee === undefined) {
    throw new Error(
      `Near: execution outcome of transaction ${transaction.transaction_hash} is not indexed yet`,
    );
  }

  return {
    hash: transaction.transaction_hash,
    failed: !status,
    fees: BigInt(fee),
    feesPayer: transaction.signer_account_id,
    operations: [...collectTransfers(receipts), ...collectActions(receipts)],
  };
};

/**
 * Block metadata plus its transactions, with their fees and the native transfers of their whole
 * receipt tree, including receipts executed in later blocks. Read from the indexer so that blocks
 * older than the retention of a non-archival node stay reachable.
 */
export async function getBlock(context: NearContext, height: number): Promise<Block> {
  if (!Number.isInteger(height) || height < 0) {
    throw new Error(`Near: invalid block height ${height}`);
  }

  const config = await context.config();
  const block = await fetchIndexedBlock(config, height);
  const transactions = await fetchBlockTransactions(config, block.block_hash);
  const blockTransactions = await promiseAllBatched(10, transactions, async transaction => {
    const receipts = await fetchTransactionReceipts(config, transaction.transaction_hash);
    return toBlockTransaction(transaction, receipts);
  });

  const info: BlockInfo = {
    height: Number(block.block_height),
    hash: block.block_hash,
    time: new Date(Number(BigInt(block.block_timestamp) / 1_000_000n)),
  };

  return { info, transactions: blockTransactions };
}
