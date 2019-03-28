// @flow

import { BigNumber } from "bignumber.js";
import type { Core, CoreCurrency, CoreAmount } from "./types";

export async function bigNumberToLibcoreAmount(
  core: Core,
  walletCurrency: CoreCurrency,
  amount: BigNumber
) {
  return core.Amount.fromHex(walletCurrency, amount.toString(16));
}

export async function libcoreAmountToBigNumber(
  core: Core, // TODO drop this param
  amountInstance: CoreAmount
): Promise<BigNumber> {
  const coreBigInt = await amountInstance.toBigInt();
  const value = await coreBigInt.toString(10);
  return BigNumber(value);
}
