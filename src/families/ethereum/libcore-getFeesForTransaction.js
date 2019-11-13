// @flow

import { BigNumber } from "bignumber.js";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";

async function ethereum(arg: *) {
  const builded = await buildTransaction(arg);
  if (!builded) return;
  const gasPrice = await libcoreAmountToBigNumber(await builded.getGasPrice());
  const gasLimit = await libcoreAmountToBigNumber(await builded.getGasLimit());
  const estimatedFees = gasPrice.times(gasLimit);
  // TODO we don't calculate yet on this side.
  const value = BigNumber(0);
  return { estimatedFees, value };
}

export default ethereum;
