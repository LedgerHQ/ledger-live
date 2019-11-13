// @flow

import { BigNumber } from "bignumber.js";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";

async function bitcoin(arg: *) {
  const builded = await buildTransaction(arg);
  if (!builded) return;
  const feesAmount = await builded.getFees();
  if (!feesAmount) {
    throw new Error("getFeesForTransaction: fees should not be undefined");
  }
  const estimatedFees = await libcoreAmountToBigNumber(feesAmount);
  // TODO we don't have a getValue on bitcoin
  const value = BigNumber(0);
  return { estimatedFees, value };
}

export default bitcoin;
