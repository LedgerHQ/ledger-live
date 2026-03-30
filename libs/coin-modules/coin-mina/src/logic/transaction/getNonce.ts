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

  const txKind = txn.txType === "send" || txn.txType === undefined ? "transfer" : "delegation";
  const data = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.fee.toNumber(),
    txn.amount.toNumber(),
    txKind,
  );

  return Number.parseInt(data.metadata.nonce, 10);
};
