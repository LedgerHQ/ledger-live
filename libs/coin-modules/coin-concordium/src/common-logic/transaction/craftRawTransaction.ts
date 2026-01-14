import { Buffer } from "buffer";
import {
  AccountAddress,
  deserializeAccountTransaction,
  SequenceNumber,
  serializeAccountTransaction,
} from "@ledgerhq/concordium-sdk-adapter";
import { AccountTransactionWithEnergy } from "@ledgerhq/hw-app-concordium/lib/serialization";

/**
 * Minimal Cursor implementation for deserializing transactions.
 * Cursor is not exported from the SDK's public API, so we implement a compatible version.
 * This matches the Cursor interface from @concordium/web-sdk/deserializationHelpers.
 */
class Cursor {
  private cursor = 0;

  private constructor(private data: Buffer) {}

  static fromHex(data: string): Cursor {
    return new Cursor(Buffer.from(data, "hex"));
  }

  read(numBytes: number = this.remainingBytes.length): Buffer {
    const end = this.cursor + numBytes;
    if (this.data.length < end) {
      throw new Error(`Failed to read ${numBytes} bytes from the cursor.`);
    }
    const data = Buffer.from(this.data.subarray(this.cursor, end));
    this.cursor += numBytes;
    return data;
  }

  get remainingBytes(): Buffer {
    return Buffer.from(this.data.subarray(this.cursor));
  }
}

/**
 * Crafts a raw Concordium transaction by parsing an existing transaction,
 * updating it with provided sender, sequence, and publicKey, then re-serializing it.
 *
 * The transaction string is expected to be a hex-encoded serialized account transaction
 * (with signatures). This function updates the transaction header with the provided parameters.
 */
export async function craftRawTransaction(
  transaction: string,
  sender: string,
  _publicKey: string,
  sequence: bigint,
): Promise<{
  nativeTransaction: AccountTransactionWithEnergy;
  serializedTransaction: string;
}> {
  try {
    const cursor = Cursor.fromHex(transaction);
    const { accountTransaction } = deserializeAccountTransaction(
      cursor as unknown as Parameters<typeof deserializeAccountTransaction>[0],
    );

    const senderAddress = AccountAddress.fromBase58(sender);
    const transactionSenderAddress = AccountAddress.toBase58(accountTransaction.header.sender);

    if (transactionSenderAddress !== sender) {
      throw new Error("Sender address does not match the transaction account");
    }

    const updatedTransaction: AccountTransactionWithEnergy = {
      type: accountTransaction.type,
      header: {
        sender: senderAddress,
        nonce: SequenceNumber.create(Number(sequence)),
        expiry: accountTransaction.header.expiry,
      },
      payload: accountTransaction.payload,
      energyAmount: BigInt(0),
    };

    const serializedTransaction = Buffer.from(
      serializeAccountTransaction(updatedTransaction, {}),
    ).toString("hex");

    return {
      nativeTransaction: updatedTransaction,
      serializedTransaction,
    };
  } catch (error) {
    throw new Error(
      `Failed to craft raw transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
