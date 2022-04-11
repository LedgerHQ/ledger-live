import { BigNumber } from "bignumber.js";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";
import {
  parseBitcoinOutput,
  parseBitcoinInput,
  perCoinLogic,
} from "./transaction";
import { promiseAllBatched } from "../../promise";
import type { BitcoinInput, BitcoinOutput } from "./types";

async function bitcoin(arg: any): Promise<{
  estimatedFees: BigNumber;
  value: BigNumber;
  txInputs: BitcoinInput[];
  txOutputs: BitcoinOutput[];
} | void> {
  const builded = await buildTransaction(arg);
  if (!builded) return;
  const feesAmount = await builded.getFees();

  if (!feesAmount) {
    throw new Error("getFeesForTransaction: fees should not be undefined");
  }

  const estimatedFees = await libcoreAmountToBigNumber(feesAmount);
  // TODO we don't have a getValue on bitcoin
  const value = new BigNumber(0);
  const inputs = await builded.getInputs();
  let txInputs: BitcoinInput[] = await promiseAllBatched(
    4,
    inputs,
    parseBitcoinInput
  );
  const outputs = await builded.getOutputs();
  let txOutputs: BitcoinOutput[] = await promiseAllBatched(
    4,
    outputs,
    parseBitcoinOutput
  );
  const { account } = arg;
  const perCoin = perCoinLogic[account.currency.id];

  if (perCoin) {
    const { syncReplaceAddress } = perCoin;

    if (syncReplaceAddress) {
      txInputs = txInputs.map((i) => ({
        ...i,
        address: syncReplaceAddress(account, i.address as string),
      }));
      txOutputs = txOutputs.map((o) => ({
        ...o,
        address: o.address && syncReplaceAddress(account, o.address),
      }));
    }
  }

  return {
    estimatedFees,
    value,
    txInputs,
    txOutputs,
  };
}

export default bitcoin;
