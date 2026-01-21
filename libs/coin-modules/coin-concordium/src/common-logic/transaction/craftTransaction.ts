import {
  AccountAddress,
  AccountTransactionType,
  CcdAmount,
  SequenceNumber,
  TransactionExpiry,
} from "@ledgerhq/concordium-sdk-adapter";
import { serializeAccountTransaction } from "@ledgerhq/hw-app-concordium/lib/serialization";
import type { AccountTransaction } from "@ledgerhq/hw-app-concordium/lib/types";
import BigNumber from "bignumber.js";
import { transformAccountTransaction } from "../utils";

/**
 * Crafts a Concordium transaction for signing and submission.
 * Returns hw-app format transaction (ready for device signing) + serialized version for network submission.
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
  transaction: AccountTransaction;
  serializedTransaction: string;
}> {
  const expiryEpochSeconds = Math.floor(Date.now() / 1000) + 3600;

  const nativeTransaction = {
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

  // Transform SDK format to hw-app format, then serialize to get transaction body for network submission
  const hwTransaction = transformAccountTransaction(nativeTransaction);
  const serializedTransaction = serializeAccountTransaction(hwTransaction).toString("hex");

  return {
    transaction: hwTransaction,
    serializedTransaction,
  };
}
