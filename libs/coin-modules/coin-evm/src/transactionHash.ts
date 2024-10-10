import { ethers } from "ethers";
import { Transaction } from "./types";
import { transactionToEthersTransaction } from "./adapters";

export const getTransactionHash = ({
  transaction,
}: {
  transaction: Transaction;
}): Promise<string> => {
  const serializedTx = ethers.utils.serializeTransaction({
    ...transactionToEthersTransaction(transaction),
  });
  const txHash = ethers.utils.keccak256(serializedTx);
  return Promise.resolve(txHash);
};
