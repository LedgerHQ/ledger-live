import { ethers } from "ethers";
import { Transaction } from "./types";
import { transactionToEthersTransaction } from "./adapters";

export const getTransactionHash = (transaction: Transaction): string =>
  ethers.utils
    .serializeTransaction({
      ...transactionToEthersTransaction(transaction),
    })
    .substring(2);
