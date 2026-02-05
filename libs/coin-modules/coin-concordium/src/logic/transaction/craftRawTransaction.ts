import { log } from "@ledgerhq/logs";
import { TransactionType, type Transaction } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";
import {
  deserializeTransfer,
  deserializeTransferWithMemo,
  serializeTransfer,
  serializeTransferWithMemo,
} from "@ledgerhq/hw-app-concordium/lib/serialization";

/**
 * Crafts a raw Concordium transaction by parsing an existing transaction,
 * updating it with provided sender, sequence, and publicKey, then re-serializing it.
 *
 * The transaction string is expected to be a hex-encoded serialized account transaction
 * in the hw-app format: [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1][payload]
 *
 * This function updates the transaction header (nonce) with the provided sequence number.
 */
export async function craftRawTransaction(
  transaction: string,
  sender: string,
  _publicKey: string,
  sequence: bigint,
): Promise<{
  nativeTransaction: Transaction;
  serializedTransaction: string;
}> {
  try {
    const buffer = Buffer.from(transaction, "hex");

    // Try to deserialize - hw-app will validate the buffer format
    let accountTransaction: Transaction;
    try {
      accountTransaction = deserializeTransfer(buffer);
    } catch {
      try {
        accountTransaction = deserializeTransferWithMemo(buffer);
      } catch (error) {
        throw new Error(
          `Failed to deserialize transaction: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const senderAddress = AccountAddress.fromBase58(sender);
    const transactionSenderAddress = accountTransaction.header.sender.address;

    if (transactionSenderAddress !== sender) {
      throw new Error("Sender address does not match the transaction account");
    }

    const updatedTransaction: Transaction = {
      type: accountTransaction.type,
      header: {
        sender: senderAddress,
        nonce: sequence,
        expiry: accountTransaction.header.expiry,
        energyAmount: accountTransaction.header.energyAmount,
      },
      payload: accountTransaction.payload,
    };

    let serializedBuffer: Buffer;
    if (accountTransaction.type === TransactionType.Transfer) {
      serializedBuffer = serializeTransfer(updatedTransaction);
    } else {
      serializedBuffer = serializeTransferWithMemo(updatedTransaction);
    }

    const serializedTransaction = serializedBuffer.toString("hex");

    return {
      nativeTransaction: updatedTransaction,
      serializedTransaction,
    };
  } catch (error) {
    log(
      "concordium",
      "craftRawTransaction",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );
    throw new Error(
      `Failed to craft raw transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
