// @flow

import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";

async function bitcoin(arg: *) {
  const builded = await buildTransaction(arg);
  if (!builded) return;
  const feesAmount = await builded.getFees();
  if (!feesAmount) {
    throw new Error("getFeesForTransaction: fees should not be undefined");
  }
  const fees = await libcoreAmountToBigNumber(feesAmount);
  return fees;
}

export default bitcoin;
