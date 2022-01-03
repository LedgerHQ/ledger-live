import type { Account } from "../../types";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { AlgorandTransaction } from "./types";
import buildTransaction from "./libcore-buildTransaction";
import { BigNumber } from "bignumber.js";

async function algorand(args: {
  account: Account;
  core: Core;
  coreAccount: CoreAccount;
  coreCurrency: CoreCurrency;
  transaction: AlgorandTransaction;
  isPartial: boolean;
  isCancelled: () => boolean;
}) {
  const builded = await buildTransaction({ ...args, isPartial: true });
  if (!builded) return;
  const fees = await builded.getFee();
  const estimatedFees = new BigNumber(fees);
  return {
    estimatedFees,
  };
}

export default algorand;
