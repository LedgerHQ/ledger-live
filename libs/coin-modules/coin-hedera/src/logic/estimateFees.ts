import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  BASE_USD_FEE_BY_OPERATION_TYPE,
  DEFAULT_TINYBAR_FEE,
  ESTIMATED_FEE_SAFETY_RATE,
  HEDERA_OPERATION_TYPES,
} from "../constants";
import { getCurrencyToUSDRate } from "./utils";

export const estimateFees = async (
  currency: CryptoCurrency,
  operationType: HEDERA_OPERATION_TYPES,
): Promise<BigNumber> => {
  let fee: BigNumber | undefined;
  const usdRate = await getCurrencyToUSDRate(currency).catch(() => null);

  if (usdRate) {
    fee = new BigNumber(BASE_USD_FEE_BY_OPERATION_TYPE[operationType])
      .dividedBy(new BigNumber(usdRate))
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
  } else {
    fee = new BigNumber(DEFAULT_TINYBAR_FEE).multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
  }

  return fee;
};
