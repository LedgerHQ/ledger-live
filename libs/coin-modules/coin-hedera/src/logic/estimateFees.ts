import BigNumber from "bignumber.js";
import { BASE_USD_FEE_BY_OPERATION_TYPE, HEDERA_OPERATION_TYPES } from "../constants";
import { getCurrencyToUSDRate } from "../bridge/utils";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const ESTIMATED_FEE_SAFETY_RATE = 2;

export const estimateFees = async (
  currency: CryptoCurrency,
  txType: HEDERA_OPERATION_TYPES,
): Promise<BigNumber> => {
  let fee: BigNumber | undefined;
  const usdRate = await getCurrencyToUSDRate(currency).catch(() => null);

  if (usdRate) {
    fee = new BigNumber(BASE_USD_FEE_BY_OPERATION_TYPE[txType])
      .dividedBy(new BigNumber(usdRate))
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
  } else {
    fee = new BigNumber("150200").multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
  }

  return fee;
};
