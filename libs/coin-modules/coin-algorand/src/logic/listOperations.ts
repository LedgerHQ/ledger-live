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
import type { ListOperationsOptions, AlgorandMemo } from "../types";

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
  });
  const operations = result.transactions
    .filter(
      tx =>
        tx.type === AlgoTransactionType.PAYMENT || tx.type === AlgoTransactionType.ASSET_TRANSFER,
    )
    .flatMap(tx => convertToOperations(tx, address));

  if (order === "desc") {
    operations.sort((a, b) => b.tx.block.height - a.tx.block.height);
  } else {
    operations.sort((a, b) => a.tx.block.height - b.tx.block.height);
  }

  return { items: operations, next: result.nextToken ?? "" };
}

function convertToOperations(tx: AlgoTransaction, address: string): Operation[] {
  const operation = convertToOperation(tx, address);
  const reward = getReward(tx, address);

  return reward === undefined
    ? [operation]
    : [
        operation,
        {
          ...operation,
          id: `${tx.id}-reward-${address}`,
          type: "REWARD",
          value: reward,
          asset: { type: "native" },
          senders: [],
          recipients: [address],
          tx: { ...operation.tx, fees: 0n },
          ...(operation.details?.memo ? { details: { memo: operation.details.memo } } : {}),
        },
      ];
}

function convertToOperation(tx: AlgoTransaction, address: string): Operation {
  const type = getOperationType(tx, address);
  const value = getOperationValue(tx, address);
  const { senders, recipients } = getOperationParties(tx);
  const asset = getOperationAsset(tx);
  const date = new Date(Number.parseInt(tx.timestamp) * SECONDS_TO_MILLISECONDS);
  const memo: AlgorandMemo | undefined = tx.note
    ? { type: "string", kind: "note", value: tx.note }
    : undefined;

  return {
    id: tx.id,
    type,
    value,
    asset,
    senders,
    recipients,
    tx: {
      hash: tx.id,
      block: {
        height: tx.round,
        hash: "",
        time: date,
      },
      fees: BigInt(tx.fee.toString()),
      feesPayer: tx.senderAddress,
      date,
      failed: false,
    },
    ...(memo ? { details: { memo } } : {}),
  };
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
  return { senders, recipients };
}

function getOperationAsset(tx: AlgoTransaction): { type: string; assetReference?: string } {
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    return { type: "asa", assetReference: (tx.details as AlgoAssetTransferInfo).assetId };
  }
  return { type: "native" };
}
