import { Transaction } from "../types";
import { BigNumber } from "bignumber.js";

export const getFeeRate = (transaction: Transaction | null | undefined): BigNumber => {
  if (!transaction) {
    return BigNumber(0);
  }
  if (transaction.feesStrategy === "custom") {
    return transaction.customFeeRate || BigNumber(0);
  }
  const filteredNetworkInfo = transaction.networkInfo.filter(
    ni => ni.label === transaction.feesStrategy,
  );

  if (!filteredNetworkInfo) {
    throw new Error("Invalid fee strategy provided");
  }

  return filteredNetworkInfo[0].amount;
};
