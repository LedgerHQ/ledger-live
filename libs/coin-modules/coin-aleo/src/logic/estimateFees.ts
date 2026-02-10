import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { AleoConfig } from "../config";
import { TRANSACTION_TYPE } from "../constants";

export async function estimateFees({
  transactionType,
  feesByTransactionType,
  estimatedFeeSafetyRate,
}: {
  transactionType: TRANSACTION_TYPE;
  feesByTransactionType: AleoConfig["feesByTransactionType"];
  estimatedFeeSafetyRate: AleoConfig["estimatedFeeSafetyRate"];
}): Promise<BigNumber> {
  const fee = feesByTransactionType[transactionType];
  invariant(typeof fee === "number", `aleo: missing fee configuration for ${transactionType}`);

  return new BigNumber(fee).multipliedBy(estimatedFeeSafetyRate);
}
