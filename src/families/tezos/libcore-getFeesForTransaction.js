// @flow

import type { Account } from "../../types";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { Transaction } from "./types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";

async function tezos(args: {
  account: Account,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean,
}) {
  const builded = await buildTransaction(args);
  if (!builded) return;
  const value = await libcoreAmountToBigNumber(await builded.getValue());
  const estimatedFees = await libcoreAmountToBigNumber(await builded.getFees());
  return { estimatedFees, value };
}

export default tezos;
