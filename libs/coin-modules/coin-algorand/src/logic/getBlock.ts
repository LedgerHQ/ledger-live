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
import type { AlgorandMemo } from "../types";
import { toNoteMemo } from "./common";
import { getBlockInfo } from "./getBlockInfo";

const NATIVE_ASSET: AssetInfo = { type: "native" };

type ExplorerAssetTransfer = NonNullable<
  ExplorerInnerTransaction<ExplorerAmount>["asset-transfer-transaction"]
>;

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
  const memo = toNoteMemo(tx.note);
  const collected: Collected = { operations: [], innerNotes: [], participationRewards: [] };
  collectOperations(tx, collected, false);
  const { operations, innerNotes, participationRewards } = collected;
  return {
    hash: tx.id,
    failed: false,
    operations,
    fees: BigInt(tx.fee),
    feesPayer: tx.sender,
    feesAsset: NATIVE_ASSET,
    details: {
      txType: tx["tx-type"],
      ...(memo ? { memo } : {}),
      ...(innerNotes.length > 0 ? { innerNotes } : {}),
      ...(participationRewards.length > 0 ? { participationRewards } : {}),
    },
  };
}

// operationIndex: the debit of the inner transfer in `operations`, its credit is the next one
type InnerNote = {
  from: string;
  to: string;
  asset: AssetInfo;
  memo: AlgorandMemo;
  operationIndex: number;
};

// operationIndex: the transfer without peer that credits the reward in `operations`
type Reward = { address: string; amount: bigint; memo?: AlgorandMemo; operationIndex: number };

type Collected = {
  operations: BlockOperation[];
  innerNotes: InnerNote[];
  participationRewards: Reward[];
};

// Known gap: an inner transaction fee that its application account pays is recorded nowhere
function collectOperations(
  tx: ExplorerInnerTransaction<ExplorerAmount>,
  collected: Collected,
  inner: boolean,
): void {
  const { operations, innerNotes, participationRewards } = collected;
  const memo = toNoteMemo(tx.note);
  const legs = transferLegs(tx);
  if (inner && memo) {
    // Each leg gives its debit then its credit, in order
    legs.forEach(({ from, to, asset }, leg) =>
      innerNotes.push({ from, to, asset, memo, operationIndex: operations.length + 2 * leg }),
    );
  }
  operations.push(
    ...legs.flatMap(({ from, to, asset, amount }) => transfer(from, to, asset, amount)),
    ...toOptOperations(tx, legs),
  );
  for (const [address, amount] of rewardsOf(tx)) {
    participationRewards.push({
      address,
      amount: BigInt(amount),
      ...(memo ? { memo } : {}),
      operationIndex: operations.length,
    });
    operations.push({ type: "transfer", address, asset: NATIVE_ASSET, amount: BigInt(amount) });
  }
  for (const innerTx of tx["inner-txns"] ?? []) collectOperations(innerTx, collected, true);
}

/** A movement of a payment or an asset transfer: to its receiver, and to its close address if any. */
type TransferLeg = { from: string; to: string; asset: AssetInfo; amount: bigint };

function transferLegs(tx: ExplorerInnerTransaction<ExplorerAmount>): TransferLeg[] {
  const payment = tx["payment-transaction"];
  if (tx["tx-type"] === AlgoTransactionType.PAYMENT && payment) {
    const closeTo = payment["close-remainder-to"];
    return [
      {
        from: tx.sender,
        to: payment.receiver,
        asset: NATIVE_ASSET,
        amount: BigInt(payment.amount),
      },
      ...(closeTo
        ? [
            {
              from: tx.sender,
              to: closeTo,
              asset: NATIVE_ASSET,
              amount: BigInt(payment["close-amount"] ?? 0),
            },
          ]
        : []),
    ];
  }

  const assetTransfer = tx["asset-transfer-transaction"];
  if (tx["tx-type"] === AlgoTransactionType.ASSET_TRANSFER && assetTransfer) {
    const asset: AssetInfo = { type: "asa", assetReference: assetTransfer["asset-id"].toString() };
    const source = assetTransfer.sender ?? tx.sender;
    const closeTo = assetTransfer["close-to"];
    return [
      { from: source, to: assetTransfer.receiver, asset, amount: BigInt(assetTransfer.amount) },
      ...(closeTo
        ? [{ from: source, to: closeTo, asset, amount: BigInt(assetTransfer["close-amount"] ?? 0) }]
        : []),
    ];
  }

  return [];
}

// The OPT_IN or OPT_OUT of an asset transfer, from the source and asset of its receiver leg
function toOptOperations(
  tx: ExplorerInnerTransaction<ExplorerAmount>,
  legs: TransferLeg[],
): BlockOperation[] {
  const assetTransfer = tx["asset-transfer-transaction"];
  if (tx["tx-type"] !== AlgoTransactionType.ASSET_TRANSFER || !assetTransfer) return [];
  const { from: source, asset } = legs[0];
  const ledgerOpType = getOptInOutType(tx.sender, source, assetTransfer);
  if (!ledgerOpType) return [];
  // Same memo as the listOperations OPT row of this transaction
  const memo = toNoteMemo(tx.note);
  return [{ type: "other", address: source, asset, ledgerOpType, ...(memo ? { memo } : {}) }];
}

function getOptInOutType(
  txSender: string,
  source: string,
  assetTransfer: ExplorerAssetTransfer,
): "OPT_IN" | "OPT_OUT" | undefined {
  const closeTo = assetTransfer["close-to"];
  if (
    assetTransfer.amount === 0 &&
    !assetTransfer.sender &&
    source === assetTransfer.receiver &&
    !closeTo
  ) {
    return "OPT_IN";
  }
  if (closeTo && source === txSender) {
    return "OPT_OUT";
  }
  return undefined;
}

function transfer(from: string, to: string, asset: AssetInfo, amount: bigint): BlockOperation[] {
  return [
    { type: "transfer", address: from, peer: to, asset, amount: -amount },
    { type: "transfer", address: to, peer: from, asset, amount },
  ];
}

// Participation rewards are credited to the accounts a transaction touches
function rewardsOf(tx: ExplorerInnerTransaction<ExplorerAmount>): [string, ExplorerAmount][] {
  const payment = tx["payment-transaction"];
  const assetTransfer = tx["asset-transfer-transaction"];
  const rewards: [string | undefined, ExplorerAmount][] = [
    [tx.sender, tx["sender-rewards"] ?? 0],
    [payment?.receiver ?? assetTransfer?.receiver, tx["receiver-rewards"] ?? 0],
    [payment?.["close-remainder-to"] ?? assetTransfer?.["close-to"], tx["close-rewards"]],
  ];

  return rewards.filter(
    (reward): reward is [string, ExplorerAmount] => reward[0] !== undefined && reward[1] > 0,
  );
}
