// @flow

import { BigNumber } from "bignumber.js";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";
import { parseBitcoinOutput, parseBitcoinInput } from "./transaction";
import { promiseAllBatched } from "../../promise";
import type { BitcoinInput, BitcoinOutput } from "./types";

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
  const inputs = await builded.getInputs();
  const txInputs: BitcoinInput[] = await promiseAllBatched(
    4,
    inputs,
    parseBitcoinInput
  );
  const outputs = await builded.getOutputs();
  const txOutputs: BitcoinOutput[] = await promiseAllBatched(
    4,
    outputs,
    parseBitcoinOutput
  );

  return { estimatedFees, value, txInputs, txOutputs };
}

export default bitcoin;
