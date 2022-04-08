import { BigNumber } from "bignumber.js";
import type { Core, CoreCurrency, CoreAmount, CoreBigInt } from "./types";
export function bigNumberToLibcoreAmount(
  core: Core,
  walletCurrency: CoreCurrency,
  amount: BigNumber
): Promise<CoreAmount> {
  return core.Amount.fromHex(walletCurrency, amount.toString(16));
}
export function bigNumberToLibcoreBigInt(
  core: Core,
  n: BigNumber
): Promise<CoreBigInt> {
  return core.BigInt.fromIntegerString(n.toString(10), 10);
}
export async function libcoreBigIntToBigNumber(
  coreBigInt: CoreBigInt
): Promise<BigNumber> {
  const value = await coreBigInt.toString(10);
  return new BigNumber(value);
}
export async function libcoreAmountToBigNumber(
  amountInstance: CoreAmount
): Promise<BigNumber> {
  const coreBigInt = await amountInstance.toBigInt();
  const res = await libcoreBigIntToBigNumber(coreBigInt);
  return res;
}
