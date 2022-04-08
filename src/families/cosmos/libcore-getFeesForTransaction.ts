import type { Account } from "../../types";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { Transaction } from "./types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";
import BigNumber from "bignumber.js";

async function cosmos(args: {
  account: Account;
  core: Core;
  coreAccount: CoreAccount;
  coreCurrency: CoreCurrency;
  transaction: Transaction;
  isPartial: boolean;
  isCancelled: () => boolean;
}): Promise<{ estimatedFees: BigNumber; estimatedGas: BigNumber } | undefined> {
  const builded = await buildTransaction({ ...args, isPartial: true });
  if (!builded) return;
  const estimatedFees = await libcoreAmountToBigNumber(await builded.getFee());
  const estimatedGas = await libcoreAmountToBigNumber(await builded.getGas());
  return {
    estimatedFees,
    estimatedGas,
  };
}

export default cosmos;
