import { log } from "@ledgerhq/logs";
import type { Transaction } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";
import {
  deserializeTransaction,
  serializeTransaction,
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
    const deserializedTransaction = deserializeTransaction(Buffer.from(transaction, "hex"));
    const senderAddress = AccountAddress.fromBase58(sender);

    if (deserializedTransaction.header.sender.address !== sender) {
      throw new Error("Sender address does not match the transaction account");
    }

    const updatedTransaction: Transaction = {
      type: deserializedTransaction.type,
      header: {
        sender: senderAddress,
        nonce: sequence,
        expiry: deserializedTransaction.header.expiry,
        energyAmount: deserializedTransaction.header.energyAmount,
      },
      payload: deserializedTransaction.payload,
    };

    const serializedTransaction = serializeTransaction(updatedTransaction).toString("hex");

    return {
      nativeTransaction: updatedTransaction,
      serializedTransaction,
    };
  } catch (error) {
    log("concordium", "craftRawTransaction", { error });
    throw new Error(
      `Failed to craft raw transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
