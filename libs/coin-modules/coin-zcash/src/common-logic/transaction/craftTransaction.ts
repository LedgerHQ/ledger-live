import BigNumber from "bignumber.js";
import { ZcashNativeTransaction } from "../../types";

const encodeNativeTx = (nativeTx: ZcashNativeTransaction) => JSON.stringify(nativeTx);

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
  },
): Promise<{
  nativeTransaction: ZcashNativeTransaction;
  serializedTransaction: string;
}> {
  const nativeTransaction: ZcashNativeTransaction = {
    TransactionType: "Payment",
    Account: account.address,
    Amount: transaction.amount.toString(),
    Destination: transaction.recipient || "",
    Fee: transaction.fee?.toString() || "0",
    Sequence: account.nextSequenceNumber || 0,
  };

  const serializedTransaction = encodeNativeTx(nativeTransaction);

  return {
    nativeTransaction,
    serializedTransaction,
  };
}
