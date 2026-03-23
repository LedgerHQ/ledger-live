import { fetchTransactionMetadata } from "../../api";
import { Transaction } from "../../types/common";
import { isValidAddress } from "../utils";

export const getNonce = async (txn: Transaction, address: string): Promise<number> => {
  if (!txn.recipient || !isValidAddress(txn.recipient)) {
    return txn.nonce;
  }

  if (!txn.amount || !txn.fees) {
    return txn.nonce;
  }

  const data = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.fee.toNumber(),
    txn.amount.toNumber(),
  );

  return parseInt(data.metadata.nonce);
};
