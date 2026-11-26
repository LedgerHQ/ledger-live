import BigNumber from "bignumber.js";
import { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import {
  getAccountTransactions,
  AlgoTransaction,
  AlgoTransactionType,
  AlgoPaymentInfo,
  AlgoAssetTransferInfo,
} from "../network";
import type { ListOperationsOptions } from "../types";
import { toNoteMemo } from "./common";

const SECONDS_TO_MILLISECONDS = 1000;

/**
 * List operations Algorand account
 * @param context - coin-module context (config + logger)
 * @param address - account address
 * @param options - Pagination and filter options
 * @returns Tuple operations array and next pagination token
 */
export async function listOperations(
  context: AlgorandContext,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { minHeight, order, limit, cursor } = options;
  const config = await context.config();
  const result = await getAccountTransactions(config, address, {
    minRound: minHeight,
    limit,
    nextToken: cursor,
    includeInnerTransactions: true,
  });
  const operations = withFeesOperations(
    result.transactions
      .filter(tx => isRelevantToAddress(tx, address))
      .flatMap(tx => convertToOperations(tx, address)),
    address,
  );

  if (order === "desc") {
    operations.sort((a, b) => b.tx.block.height - a.tx.block.height);
  } else {
    operations.sort((a, b) => a.tx.block.height - b.tx.block.height);
  }

  return { items: operations, next: result.nextToken ?? "" };
}

// The fee payer without a native row gets a FEES row, last: https://github.com/LedgerHQ/a4/blob/main/docs/architecture/decisions/0028-wallet-operation-semantics-in-events.md (rule 4)
function withFeesOperations(operations: Operation[], address: string): Operation[] {
  const byHash = new Map<string, Operation[]>();
  for (const op of operations) byHash.set(op.tx.hash, [...(byHash.get(op.tx.hash) ?? []), op]);

  return [...byHash.values()].flatMap(rows => {
    const others = rows.filter(op => op.type !== "FEES");
    const feesPayer = rows[0].tx.feesPayer === address;
    const native = others.some(op => op.asset.type === "native");
    if (!feesPayer || native) return others;
    return [...others, rows.find(op => op.type === "FEES") ?? toFeesOperation(rows, address)];
  });
}

function toFeesOperation(rows: Operation[], address: string): Operation {
  const { tx } = rows[0];
  const memo = rows.find(op => op.id === tx.hash)?.details?.memo;
  return {
    id: `${tx.hash}-fees`,
    type: "FEES",
    value: 0n,
    asset: { type: "native" },
    senders: [address],
    recipients: [],
    tx,
    ...(memo ? { details: { memo } } : {}),
  };
}

function isRootFeePayer(tx: AlgoTransaction, address: string): boolean {
  return tx.id === tx.rootId && tx.feesPayer === address;
}

function isMovementParty(tx: AlgoTransaction, address: string): boolean {
  const { senders, recipients } = getOperationParties(tx);
  return senders.includes(address) || recipients.includes(address);
}

function isRelevantToAddress(tx: AlgoTransaction, address: string): boolean {
  return isRootFeePayer(tx, address) || (isTransfer(tx) && isMovementParty(tx, address));
}

function convertToOperations(tx: AlgoTransaction, address: string): Operation[] {
  const reward = getReward(tx, address);
  const rewards = reward === undefined ? [] : [toRewardOperation(tx, address, reward)];
  if (!isTransfer(tx) || !isMovementParty(tx, address)) {
    return [...(isRootFeePayer(tx, address) ? [toFeesRow(tx, address)] : []), ...rewards];
  }

  const type = getOperationType(tx, address);
  const primary =
    type === "OPT_IN" || type === "OPT_OUT"
      ? [toOperation(tx, { ...toOptFields(tx, address), type }, { ledgerOpType: type })]
      : toLegOperations(tx, address);
  // A transaction whose movements are all 0 still costs its fee payer the fee
  const fees = primary.length === 0 && isRootFeePayer(tx, address) ? [toFeesRow(tx, address)] : [];
  return [...primary, ...fees, ...rewards];
}

function isTransfer(tx: AlgoTransaction): boolean {
  return tx.type === AlgoTransactionType.PAYMENT || tx.type === AlgoTransactionType.ASSET_TRANSFER;
}

type OperationFields = Pick<
  Operation,
  "id" | "type" | "value" | "asset" | "senders" | "recipients"
>;

// Every row of a transaction carries its note and its location
function toOperation(
  tx: AlgoTransaction,
  fields: OperationFields,
  extraDetails: Record<string, unknown> = {},
): Operation {
  const date = new Date(Number.parseInt(tx.timestamp) * SECONDS_TO_MILLISECONDS);
  const memo = toNoteMemo(tx.note);
  const details = { ...(memo ? { memo } : {}), ...extraDetails };
  return {
    ...fields,
    tx: {
      hash: tx.rootId,
      block: { height: tx.round, hash: "", time: date },
      fees: BigInt(tx.fee.toString()),
      feesPayer: tx.feesPayer,
      feesAsset: { type: "native" },
      date,
      failed: false,
    },
    ...(Object.keys(details).length > 0 ? { details } : {}),
  };
}

function toFeesRow(tx: AlgoTransaction, address: string): Operation {
  return toOperation(tx, {
    id: tx.id,
    type: "FEES",
    value: 0n,
    asset: { type: "native" },
    senders: [address],
    recipients: [],
  });
}

function toRewardOperation(tx: AlgoTransaction, address: string, reward: bigint): Operation {
  return toOperation(tx, {
    id: `${tx.id}-reward-${address}`,
    type: "REWARD",
    value: reward,
    asset: { type: "native" },
    senders: [],
    recipients: [address],
  });
}

// An OPT row describes the whole transaction: A4 folds the transfers of an OPT_OUT into one operation too
function toOptFields(tx: AlgoTransaction, address: string): Omit<OperationFields, "type"> {
  return {
    id: tx.id,
    value: getOperationValue(tx, address),
    asset: getOperationAsset(tx),
    ...getOperationParties(tx),
  };
}

/** A movement of a payment or an asset transfer: to its receiver, or to its close address. */
type TransferLeg = { from: string; to: string; amount: bigint; close: boolean };

function transferLegs(tx: AlgoTransaction): TransferLeg[] {
  const from = getOperationSender(tx);
  const leg = (to: string, amount: BigNumber, close: boolean): TransferLeg => ({
    from,
    to,
    amount: BigInt(amount.toString()),
    close,
  });
  if (tx.type === AlgoTransactionType.PAYMENT) {
    const { recipientAddress, amount, closeToAddress, closeAmount } = tx.details as AlgoPaymentInfo;
    return [
      leg(recipientAddress, amount, false),
      ...(closeToAddress ? [leg(closeToAddress, closeAmount ?? new BigNumber(0), true)] : []),
    ];
  }
  const { assetRecipientAddress, assetAmount, assetCloseToAddress, assetCloseAmount } =
    tx.details as AlgoAssetTransferInfo;
  return [
    leg(assetRecipientAddress, assetAmount, false),
    ...(assetCloseToAddress
      ? [leg(assetCloseToAddress, assetCloseAmount ?? new BigNumber(0), true)]
      : []),
  ];
}

// One row per getBlock transfer, as A4 derives them; a lone 0 movement keeps its row, as in the other coin modules
function toLegOperations(tx: AlgoTransaction, address: string): Operation[] {
  const legs = transferLegs(tx);
  const asset = getOperationAsset(tx);
  return legs
    .filter(leg => leg.from === address || leg.to === address)
    .filter(leg => leg.amount !== 0n || legs.length === 1)
    .flatMap(leg => {
      const id = leg.close ? `${tx.id}-close` : tx.id;
      if (leg.from === address && leg.to === address) {
        return leg.amount === 0n
          ? [toLegOperation(tx, leg, asset, id, "OUT", 0n)]
          : [
              toLegOperation(tx, leg, asset, id, "OUT", leg.amount),
              toLegOperation(tx, leg, asset, `${id}-in`, "IN", leg.amount),
            ];
      }
      const type = leg.from === address ? "OUT" : "IN";
      return [toLegOperation(tx, leg, asset, id, type, leg.amount)];
    });
}

function toLegOperation(
  tx: AlgoTransaction,
  leg: TransferLeg,
  asset: Operation["asset"],
  id: string,
  type: "IN" | "OUT",
  value: bigint,
): Operation {
  const senders = [leg.from];
  const recipients = [leg.to];
  // The token details of the coin-modules, which A4 also sets on the token operations of a block
  const tokenDetails =
    asset.type === "native"
      ? {}
      : {
          ledgerOpType: type,
          assetAmount: value.toString(),
          assetSenders: senders,
          assetRecipients: recipients,
        };
  return toOperation(tx, { id, type, value, asset, senders, recipients }, tokenDetails);
}

function getReward(tx: AlgoTransaction, address: string): bigint | undefined {
  const payment =
    tx.type === AlgoTransactionType.PAYMENT ? (tx.details as AlgoPaymentInfo) : undefined;
  const assetTransfer =
    tx.type === AlgoTransactionType.ASSET_TRANSFER
      ? (tx.details as AlgoAssetTransferInfo)
      : undefined;
  const rewards = [
    tx.senderAddress === address ? tx.senderRewards : undefined,
    payment?.recipientAddress === address || assetTransfer?.assetRecipientAddress === address
      ? tx.recipientRewards
      : undefined,
    payment?.closeToAddress === address || assetTransfer?.assetCloseToAddress === address
      ? tx.closeRewards
      : undefined,
  ];
  let reward = new BigNumber(0);
  for (const value of rewards) {
    if (value) reward = reward.plus(value);
  }

  return reward.isZero() ? undefined : BigInt(reward.toString());
}

function getOperationType(tx: AlgoTransaction, address: string): string {
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;
    const sender = details.assetSenderAddress ?? tx.senderAddress;
    if (
      details.assetAmount.isZero() &&
      !details.assetSenderAddress &&
      sender === details.assetRecipientAddress &&
      !details.assetCloseToAddress
    ) {
      return "OPT_IN";
    }
    if (details.assetCloseToAddress && sender === address) {
      return "OPT_OUT";
    }
  }
  return getOperationSender(tx) === address ? "OUT" : "IN";
}

function getOperationValue(tx: AlgoTransaction, address: string): bigint {
  if (tx.type === AlgoTransactionType.PAYMENT) {
    const details = tx.details as AlgoPaymentInfo;
    return BigInt(
      getAddressTransferAmount(
        tx.senderAddress,
        details.recipientAddress,
        details.closeToAddress,
        details.amount,
        details.closeAmount,
        address,
      ).toString(),
    );
  }
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;
    return BigInt(
      getAddressTransferAmount(
        details.assetSenderAddress ?? tx.senderAddress,
        details.assetRecipientAddress,
        details.assetCloseToAddress,
        details.assetAmount,
        details.assetCloseAmount,
        address,
      ).toString(),
    );
  }
  return 0n;
}

function getAddressTransferAmount(
  sender: string,
  recipient: string,
  closeTo: string | undefined,
  amount: BigNumber,
  closeAmount: BigNumber | undefined,
  address: string,
): BigNumber {
  let value = amount.minus(amount);
  if ((sender === address) !== (recipient === address)) value = value.plus(amount);
  if (closeAmount && (sender === address) !== (closeTo === address))
    value = value.plus(closeAmount);
  return value;
}

function getOperationSender(tx: AlgoTransaction): string {
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    return (tx.details as AlgoAssetTransferInfo).assetSenderAddress ?? tx.senderAddress;
  }
  return tx.senderAddress;
}

function getOperationParties(tx: AlgoTransaction): { senders: string[]; recipients: string[] } {
  const senders = [getOperationSender(tx)];
  const recipients: string[] = [];
  if (tx.type === AlgoTransactionType.PAYMENT) {
    const details = tx.details as AlgoPaymentInfo;
    recipients.push(details.recipientAddress);
    if (details.closeToAddress) recipients.push(details.closeToAddress);
  } else if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;
    recipients.push(details.assetRecipientAddress);
    if (details.assetCloseToAddress) recipients.push(details.assetCloseToAddress);
  }
  // A transaction that closes to its own receiver names it once
  return { senders, recipients: [...new Set(recipients)] };
}

function getOperationAsset(tx: AlgoTransaction): { type: string; assetReference?: string } {
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    return { type: "asa", assetReference: (tx.details as AlgoAssetTransferInfo).assetId };
  }
  return { type: "native" };
}
