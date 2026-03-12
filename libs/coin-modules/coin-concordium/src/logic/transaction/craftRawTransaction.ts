import { log } from "@ledgerhq/logs";
import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
import {
  type Transaction,
  AccountAddress,
  deserializeTransaction,
  serializeTransaction,
} from "@ledgerhq/concordium-core";

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
): Promise<CraftedTransaction> {
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

    return { transaction: serializeTransaction(updatedTransaction).toString("hex") };
  } catch (error) {
    log("concordium", "craftRawTransaction", { error });
    throw new Error(
      `Failed to craft raw transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
