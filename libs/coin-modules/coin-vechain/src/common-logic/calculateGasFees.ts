import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { parseAddress } from "./parseAddress";
import { calculateClausesVet, calculateClausesVtho } from "./calculateClauses";
import { estimateGas } from "./estimateGas";
import { getThorClient } from "./getThorClient";

export const calculateGasFees = async (
  transaction: Transaction,
  isTokenAccount: boolean,
  originAddress: string,
): Promise<{
  estimatedGas: number;
  estimatedGasFees: BigNumber;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
}> => {
  if (transaction.recipient && parseAddress(transaction.recipient)) {
    let clauses;

    if (isTokenAccount) {
      clauses = await calculateClausesVtho(transaction.recipient, transaction.amount);
    } else {
      clauses = await calculateClausesVet(transaction.recipient, transaction.amount);
    }

    const gasEstimation = await estimateGas(clauses, originAddress);
    const thorClient = getThorClient();
    const body = await thorClient.transactions.buildTransactionBody(
      clauses,
      gasEstimation.totalGas,
      {},
    );

    return {
      estimatedGas: gasEstimation.totalGas,
      estimatedGasFees: new BigNumber(body.maxFeePerGas ?? "0").times(gasEstimation.totalGas),
      maxFeePerGas: Number(body.maxFeePerGas ?? "0"),
      maxPriorityFeePerGas: Number(body.maxPriorityFeePerGas ?? "0"),
    };
  }
  return {
    estimatedGas: 0,
    estimatedGasFees: new BigNumber(0),
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0,
  };
};
