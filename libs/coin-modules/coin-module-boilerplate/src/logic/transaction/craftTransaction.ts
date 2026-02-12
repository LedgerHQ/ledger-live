import BigNumber from "bignumber.js";
import { BoilerplateNativeTransaction } from "../../types";

const encodeNativeTx = (nativeTx: BoilerplateNativeTransaction) => JSON.stringify(nativeTx);

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
  nativeTransaction: BoilerplateNativeTransaction;
  serializedTransaction: string;
}> {
  const nativeTransaction: BoilerplateNativeTransaction = {
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
