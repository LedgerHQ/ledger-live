import BigNumber from "bignumber.js";
import type { Transaction } from "@ledgerhq/hw-app-concordium/lib/types";
import { encodeMemoToCbor } from "@ledgerhq/hw-app-concordium/lib/cbor";
import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";

/**
 * Crafts a Concordium transaction for signing.
 * Returns structured transaction format that hw-app will serialize during signing.
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
    memo?: string;
  },
): Promise<Transaction> {
  const expiryEpochSeconds = Math.floor(Date.now() / 1000) + 3600;

  const transactionType = transaction.memo
    ? TransactionType.TransferWithMemo
    : TransactionType.Transfer;

  const structuredTransaction: Transaction = {
    type: transactionType,
    header: {
      sender: AccountAddress.fromBase58(account.address),
      nonce: BigInt(account.nextSequenceNumber || 0),
      expiry: BigInt(expiryEpochSeconds),
      energyAmount: transaction.energy ?? BigInt(0),
    },
    payload: {
      amount: BigInt(transaction.amount.toString()),
      toAddress: AccountAddress.fromBase58(transaction.recipient || ""),
      ...(transaction.memo ? { memo: encodeMemoToCbor(transaction.memo) } : {}),
    },
  };

  return structuredTransaction;
}
