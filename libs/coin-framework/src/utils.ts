import BigNumber from "bignumber.js";
import { SendTransactionIntent, TransactionIntent } from "./api";

export function fromBigNumberToBigInt<T>(
  bigNumber: BigNumber | undefined,
  defaultValue?: T,
): bigint | T {
  if (bigNumber != null) {
    return BigInt(bigNumber.toFixed());
  }
  return defaultValue as T;
}

export function isSendTransactionIntent(tx: TransactionIntent): tx is SendTransactionIntent {
  return tx.intentType === "transaction";
}
