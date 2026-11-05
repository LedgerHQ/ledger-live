import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { AlgoTransactionType, getBlockTransactions } from "../network";
import type {
  ExplorerAmount,
  ExplorerInnerTransaction,
  ExplorerTransaction,
} from "../network/types";
import { getBlockInfo } from "./getBlockInfo";

const NATIVE_ASSET: AssetInfo = { type: "native" };

/**
 * Get a block with all its transactions
 * @param context - The coin-module context (config + logger)
 * @param height - The block height (round number)
 * @returns The block info and its transactions, inner transactions flattened into their parent
 */
export async function getBlock(context: AlgorandContext, height: number): Promise<Block> {
  // The node answers first so that a missing round fails as not found rather than not indexed
  const info = await getBlockInfo(context, height);
  const transactions = await getBlockTransactions(await context.config(), height);

  return { info, transactions: transactions.map(toBlockTransaction) };
}

// A block only holds transactions that succeeded
function toBlockTransaction(tx: ExplorerTransaction<ExplorerAmount>): BlockTransaction {
  return {
    hash: tx.id,
    failed: false,
    operations: toOperations(tx),
    fees: BigInt(tx.fee),
    feesPayer: tx.sender,
    details: { txType: tx["tx-type"] },
  };
}

// The fees of inner transactions are left out: they are paid by application accounts
function toOperations(tx: ExplorerInnerTransaction<ExplorerAmount>): BlockOperation[] {
  return [
    ...toTransferOperations(tx),
    ...toRewardOperations(tx),
    ...(tx["inner-txns"] ?? []).flatMap(toOperations),
  ];
}

function toTransferOperations(tx: ExplorerInnerTransaction<ExplorerAmount>): BlockOperation[] {
  const payment = tx["payment-transaction"];
  if (tx["tx-type"] === AlgoTransactionType.PAYMENT && payment) {
    const closeTo = payment["close-remainder-to"];
    return [
      ...transfer(tx.sender, payment.receiver, NATIVE_ASSET, BigInt(payment.amount)),
      ...(closeTo
        ? transfer(tx.sender, closeTo, NATIVE_ASSET, BigInt(payment["close-amount"] ?? 0))
        : []),
    ];
  }

  const assetTransfer = tx["asset-transfer-transaction"];
  if (tx["tx-type"] === AlgoTransactionType.ASSET_TRANSFER && assetTransfer) {
    const asset: AssetInfo = { type: "asa", assetReference: assetTransfer["asset-id"].toString() };
    const source = assetTransfer.sender ?? tx.sender;
    const closeTo = assetTransfer["close-to"];
    return [
      ...transfer(source, assetTransfer.receiver, asset, BigInt(assetTransfer.amount)),
      ...(closeTo
        ? transfer(source, closeTo, asset, BigInt(assetTransfer["close-amount"] ?? 0))
        : []),
    ];
  }

  return [];
}

function transfer(from: string, to: string, asset: AssetInfo, amount: bigint): BlockOperation[] {
  return [
    { type: "transfer", address: from, peer: to, asset, amount: -amount },
    { type: "transfer", address: to, peer: from, asset, amount },
  ];
}

// Participation rewards are credited to the accounts a transaction touches
function toRewardOperations(tx: ExplorerInnerTransaction<ExplorerAmount>): BlockOperation[] {
  const payment = tx["payment-transaction"];
  const rewards: [string | undefined, ExplorerAmount][] = [
    [tx.sender, tx["sender-rewards"]],
    [payment?.receiver ?? tx["asset-transfer-transaction"]?.receiver, tx["receiver-rewards"]],
    [payment?.["close-remainder-to"], tx["close-rewards"]],
  ];

  return rewards
    .filter(
      (reward): reward is [string, ExplorerAmount] => reward[0] !== undefined && reward[1] > 0,
    )
    .map(([address, amount]) => ({
      type: "transfer",
      address,
      asset: NATIVE_ASSET,
      amount: BigInt(amount),
    }));
}
