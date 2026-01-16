import {
  AccountAddress,
  AccountTransactionType,
  CcdAmount,
  SequenceNumber,
  TransactionExpiry,
} from "@ledgerhq/concordium-sdk-adapter";
import {
  AccountTransactionWithEnergy,
  serializeAccountTransaction,
} from "@ledgerhq/hw-app-concordium/lib/serialization";
import BigNumber from "bignumber.js";

/**
 * Crafts a Concordium transaction for signing and submission.
 *
 * Creates AccountTransactionWithEnergy for hardware wallet signing using SDK types.
 * Uses hw-app-concordium's serializeAccountTransaction which serializes
 * header + type + payload without requiring signatures (unlike the SDK's
 * serializeAccountTransaction which requires signatures).
 */
export async function craftTransaction(
  account: {
    address: string;
    nextSequenceNumber?: number;
    publicKey?: string;
  },
  transaction: {
    recipient?: string;
    amount: BigNumber;
    fee?: BigNumber;
    energy?: bigint;
  },
): Promise<{
  nativeTransaction: AccountTransactionWithEnergy;
  serializedTransaction: string;
}> {
  const expiryEpochSeconds = Math.floor(Date.now() / 1000) + 3600;

  const nativeTransaction: AccountTransactionWithEnergy = {
    type: AccountTransactionType.Transfer,
    header: {
      sender: AccountAddress.fromBase58(account.address),
      nonce: SequenceNumber.create(Number(account.nextSequenceNumber || 0)),
      expiry: TransactionExpiry.fromEpochSeconds(expiryEpochSeconds),
    },
    payload: {
      amount: CcdAmount.fromMicroCcd(transaction.amount.toString()),
      toAddress: AccountAddress.fromBase58(transaction.recipient || ""),
    },
    energyAmount: transaction.energy ?? BigInt(0),
  };

  const serializedTransaction = serializeAccountTransaction(nativeTransaction).toString("hex");

  return {
    nativeTransaction,
    serializedTransaction,
  };
}
