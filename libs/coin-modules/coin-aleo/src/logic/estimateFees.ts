import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { AleoConfig } from "../config";
import { TRANSACTION_TYPE } from "../constants";

export async function estimateFees({
  feesByTransactionType,
  transactionType,
  estimatedFeeSafetyRate,
}: {
  feesByTransactionType: AleoConfig["feesByTransactionType"];
  transactionType: TRANSACTION_TYPE;
  estimatedFeeSafetyRate: AleoConfig["estimatedFeeSafetyRate"];
}): Promise<BigNumber> {
  const transactionFee = feesByTransactionType[transactionType];

  invariant(
    typeof transactionFee === "number",
    `aleo: missing fee configuration for ${transactionType}`,
  );

  return new BigNumber(transactionFee).multipliedBy(estimatedFeeSafetyRate);
}
