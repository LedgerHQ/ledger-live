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
  const innerNotes = (tx["inner-txns"] ?? []).flatMap(toInnerNotes);
  const rewards = toRewards(tx);
  return {
    hash: tx.id,
    failed: false,
    operations: toOperations(tx),
    fees: BigInt(tx.fee),
    feesPayer: tx.sender,
    details: {
      txType: tx["tx-type"],
      ...(memo ? { memo } : {}),
      ...(innerNotes.length > 0 ? { innerNotes } : {}),
      ...(rewards.length > 0 ? { rewards } : {}),
    },
  };
}

/**
 * The note of an inner transaction, on each of its transfers: listOperations gives every row the note of the
 * transaction it comes from, and the transfers of inner transactions are flattened into their root, which has its own
 * note (`memo`).
 */
type InnerNote = { from: string; to: string; asset: AssetInfo; memo: AlgorandMemo };

function toInnerNotes(tx: ExplorerInnerTransaction<ExplorerAmount>): InnerNote[] {
  const memo = toNoteMemo(tx.note);
  const notes = memo
    ? transferLegs(tx).map(({ from, to, asset }) => ({ from, to, asset, memo }))
    : [];
  return [...notes, ...(tx["inner-txns"] ?? []).flatMap(toInnerNotes)];
}

/**
 * The participation rewards of a transaction and of its inner transactions, with the note of the transaction that
 * pays them: listOperations gives them as REWARD rows, getBlock as transfers without peer.
 */
type Reward = { address: string; amount: bigint; memo?: AlgorandMemo };

function toRewards(tx: ExplorerInnerTransaction<ExplorerAmount>): Reward[] {
  const memo = toNoteMemo(tx.note);
  return [
    ...rewardsOf(tx).map(([address, amount]) => ({
      address,
      amount: BigInt(amount),
      ...(memo ? { memo } : {}),
    })),
    ...(tx["inner-txns"] ?? []).flatMap(toRewards),
  ];
}

// The fees of inner transactions are left out: they are paid by application accounts
function toOperations(tx: ExplorerInnerTransaction<ExplorerAmount>): BlockOperation[] {
  return [
    ...toTransferOperations(tx),
    ...toRewardOperations(tx),
    ...(tx["inner-txns"] ?? []).flatMap(toOperations),
  ];
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

function toTransferOperations(tx: ExplorerInnerTransaction<ExplorerAmount>): BlockOperation[] {
  const transfers = transferLegs(tx).flatMap(({ from, to, asset, amount }) =>
    transfer(from, to, asset, amount),
  );

  const assetTransfer = tx["asset-transfer-transaction"];
  if (tx["tx-type"] === AlgoTransactionType.ASSET_TRANSFER && assetTransfer) {
    const asset: AssetInfo = { type: "asa", assetReference: assetTransfer["asset-id"].toString() };
    const source = assetTransfer.sender ?? tx.sender;
    const ledgerOpType = getOptInOutType(tx.sender, source, assetTransfer);
    // Same memo as the listOperations OPT row of this transaction
    const memo = toNoteMemo(tx.note);
    return [
      ...transfers,
      ...(ledgerOpType
        ? [
            {
              type: "other" as const,
              address: source,
              asset,
              ledgerOpType,
              ...(memo ? { memo } : {}),
            },
          ]
        : []),
    ];
  }

  return transfers;
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

function toRewardOperations(tx: ExplorerInnerTransaction<ExplorerAmount>): BlockOperation[] {
  return rewardsOf(tx).map(([address, amount]) => ({
    type: "transfer",
    address,
    asset: NATIVE_ASSET,
    amount: BigInt(amount),
  }));
}
