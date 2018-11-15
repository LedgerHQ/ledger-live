// @flow

import { BigNumber } from "bignumber.js";

export async function bigNumberToLibcoreAmount(
  core: *,
  walletCurrency: *,
  amount: BigNumber,
) {
  return core.coreAmount.fromHex(walletCurrency, amount.toString(16));
}

export async function libcoreAmountToBigNumber(
  core: *,
  amountInstance: string,
): Promise<BigNumber> {
  const coreBigInt = await core.coreAmount.toBigInt(amountInstance);
  const { value } = await core.coreBigInt.toString(coreBigInt, 10);
  return BigNumber(value);
}
