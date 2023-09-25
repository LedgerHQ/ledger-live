import BigNumber from "bignumber.js";
import { getSwapAPIError } from "..";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooLowOrTooHigh,
  SwapGenericAPIError,
} from "../../../errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { ExchangeRateErrors } from "../types";
import { Unit } from "@ledgerhq/types-cryptoassets";

export function inferError(response: ExchangeRateErrors, unitFrom: Unit): Error {
  const isAMinMaxError =
    "minAmountFrom" in response &&
    "maxAmountFrom" in response &&
    "amountRequested" in response &&
    !!response.minAmountFrom &&
    !!response.maxAmountFrom &&
    !!response.amountRequested;

  const isADexMinMaxError =
    !("minAmountFrom" in response) &&
    !("maxAmountFrom" in response) &&
    "errorCode" in response &&
    response.providerType === "DEX" &&
    response.errorCode !== 300;

  const isAnErrorCodeMessageError = "errorCode" in response && "errorMessage" in response;

  if (isADexMinMaxError) {
    return new SwapExchangeRateAmountTooLowOrTooHigh(undefined, {
      message: "",
    });
  }

  if (isAMinMaxError) {
    const isTooSmall = BigNumber(response.amountRequested).lt(response.minAmountFrom);

    const minOrMaxError = isTooSmall
      ? {
          error: SwapExchangeRateAmountTooLow,
          amount: response.minAmountFrom,
          key: "minAmountFromFormatted",
        }
      : {
          error: SwapExchangeRateAmountTooHigh,
          amount: response.maxAmountFrom!,
          key: "maxAmountFromFormatted",
        };

    return new minOrMaxError.error(undefined, {
      [minOrMaxError.key]: formatCurrencyUnit(
        unitFrom,
        new BigNumber(minOrMaxError?.amount).times(BigNumber(10).pow(unitFrom.magnitude)),
        {
          alwaysShowSign: false,
          disableRounding: true,
          showCode: true,
        },
      ),
      amount: new BigNumber(minOrMaxError.amount),
    });
  }

  if (isAnErrorCodeMessageError) {
    return getSwapAPIError(response.errorCode, response.errorMessage);
  }

  return new SwapGenericAPIError();
}
