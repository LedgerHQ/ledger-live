import { Operation } from "@ledgerhq/coin-framework/api/types";
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
 * List operations for an Algorand account
 * @param address - The account address
 * @param options - Pagination and filter options
 * @returns Tuple of operations array and next pagination token
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<[Operation<AlgorandMemo>[], string]> {
  const { minHeight, order, limit, token } = options;

  const result = await getAccountTransactions(address, {
    minRound: minHeight,
    limit,
    nextToken: token,
  });

  // Filter to only payment and asset transfer transactions
  const filteredTxs = result.transactions.filter(
    tx => tx.type === AlgoTransactionType.PAYMENT || tx.type === AlgoTransactionType.ASSET_TRANSFER,
  );

  // Convert to operations
  const operations = filteredTxs.map(tx => convertToOperation(tx, address));

  // Sort by order preference
  if (order === "desc") {
    operations.sort((a, b) => b.tx.block.height - a.tx.block.height);
  } else {
    operations.sort((a, b) => a.tx.block.height - b.tx.block.height);
  }

  // Return operations with next pagination token (empty string if no more pages)
  return [operations, result.nextToken ?? ""];
}

function convertToOperation(tx: AlgoTransaction, address: string): Operation<AlgorandMemo> {
  const type = getOperationType(tx, address);
  const value = getOperationValue(tx, address);
  const { senders, recipients } = getOperationParties(tx);
  const asset = getOperationAsset(tx);

  const date = new Date(Number.parseInt(tx.timestamp) * SECONDS_TO_MILLISECONDS);

  const memo: AlgorandMemo | undefined = tx.note
    ? { type: "string", kind: "note", value: tx.note }
    : undefined;

  const operation: Operation<AlgorandMemo> = {
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
        hash: "", // Block hash not available from indexer transactions
        time: date,
      },
      fees: BigInt(tx.fee.toString()),
      date,
      failed: false, // Algorand only returns confirmed (successful) transactions
    },
  };

  if (memo) {
    operation.memo = memo;
  }

  // Add rewards to details if present
  const rewards = tx.senderRewards.plus(tx.recipientRewards);
  if (!rewards.isZero()) {
    operation.details = {
      rewards: BigInt(rewards.toString()),
    };
  }

  return operation;
}

function getOperationType(tx: AlgoTransaction, address: string): string {
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;

    // Opt-in: sender sends 0 amount to themselves
    if (details.assetAmount.isZero() && tx.senderAddress === details.assetRecipientAddress) {
      return "OPT_IN";
    }

    // Opt-out: has close-to address and sender is the account
    if (details.assetCloseToAddress && tx.senderAddress === address) {
      return "OPT_OUT";
    }

    return tx.senderAddress === address ? "OUT" : "IN";
  }

  return tx.senderAddress === address ? "OUT" : "IN";
}

function getOperationValue(tx: AlgoTransaction, address: string): bigint {
  if (tx.type === AlgoTransactionType.PAYMENT) {
    const details = tx.details as AlgoPaymentInfo;
    return BigInt(details.amount.toString());
  }

  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;
    let amount = details.assetAmount;

    // Include close amount if applicable
    if (details.assetCloseAmount) {
      const isSender = tx.senderAddress === address;
      const isCloseRecipient = details.assetCloseToAddress === address;

      if (isSender !== isCloseRecipient) {
        amount = amount.plus(details.assetCloseAmount);
      }
    }

    return BigInt(amount.toString());
  }

  return 0n;
}

function getOperationParties(tx: AlgoTransaction): { senders: string[]; recipients: string[] } {
  const senders = [tx.senderAddress];
  const recipients: string[] = [];

  if (tx.type === AlgoTransactionType.PAYMENT) {
    const details = tx.details as AlgoPaymentInfo;
    recipients.push(details.recipientAddress);
    if (details.closeToAddress) {
      recipients.push(details.closeToAddress);
    }
  } else if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;
    recipients.push(details.assetRecipientAddress);
    if (details.assetCloseToAddress) {
      recipients.push(details.assetCloseToAddress);
    }
  }

  return { senders, recipients };
}

function getOperationAsset(tx: AlgoTransaction): { type: string; assetReference?: string } {
  if (tx.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = tx.details as AlgoAssetTransferInfo;
    return {
      type: "asa",
      assetReference: details.assetId,
    };
  }

  return { type: "native" };
}
