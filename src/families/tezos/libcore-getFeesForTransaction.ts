import type { Account } from "../../types";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { Transaction } from "./types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";
import BigNumber from "bignumber.js";

async function tezos(args: {
  account: Account;
  core: Core;
  coreAccount: CoreAccount;
  coreCurrency: CoreCurrency;
  transaction: Transaction;
  isPartial: boolean;
  isCancelled: () => boolean;
}): Promise<{ estimatedFees: BigNumber; value: BigNumber } | void> {
  const builded = await buildTransaction(args);
  if (!builded) return;
  const value = await libcoreAmountToBigNumber(await builded.getValue());
  const estimatedFees = await libcoreAmountToBigNumber(await builded.getFees());
  return {
    estimatedFees,
    value,
  };
}

export default tezos;
