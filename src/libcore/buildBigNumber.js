// @flow

import { BigNumber } from "bignumber.js";
import type { Core, CoreCurrency, CoreAmount, CoreBigInt } from "./types";

export async function bigNumberToLibcoreAmount(
  core: Core,
  walletCurrency: CoreCurrency,
  amount: BigNumber
) {
  return core.Amount.fromHex(walletCurrency, amount.toString(16));
}

export async function libcoreBigIntToBigNumber(
  coreBigInt: CoreBigInt
): Promise<BigNumber> {
  const value = await coreBigInt.toString(10);
  return BigNumber(value);
}

export async function libcoreAmountToBigNumber(
  amountInstance: CoreAmount
): Promise<BigNumber> {
  const coreBigInt = await amountInstance.toBigInt();
  const res = await libcoreBigIntToBigNumber(coreBigInt);
  return res;
}
