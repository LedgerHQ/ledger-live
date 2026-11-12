import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import { getSwapAPIError } from "..";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooLowOrTooHigh,
  SwapGenericAPIError,
} from "../../../errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { ExchangeRateErrors } from "../types";
import { Unit } from "@domain/entity-currency-unit";

export function inferError(response: ExchangeRateErrors, unitFrom: Unit): Error {
  const isAMinMaxError =
    ("minAmountFrom" in response || "maxAmountFrom" in response) &&
    "amountRequested" in response &&
    (!!response.minAmountFrom || !!response.maxAmountFrom) &&
    !!response.amountRequested;

  const isADexMinMaxError =
    (!("minAmountFrom" in response) || !("maxAmountFrom" in response)) &&
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
    const requested = parseFiniteBigNumber(response.amountRequested);
    const min = parseFiniteBigNumber(response.minAmountFrom);
    const max = parseFiniteBigNumber(response.maxAmountFrom);
    const isTooSmall = !!requested && !!min && requested.lt(min);
    const minOrMax = isTooSmall
      ? { error: SwapExchangeRateAmountTooLow, amount: min, key: "minAmountFromFormatted" }
      : { error: SwapExchangeRateAmountTooHigh, amount: max, key: "maxAmountFromFormatted" };

    if (minOrMax.amount) {
      return new minOrMax.error(undefined, {
        [minOrMax.key]: formatCurrencyUnit(
          unitFrom,
          minOrMax.amount.shiftedBy(unitFrom.magnitude),
          {
            alwaysShowSign: false,
            disableRounding: true,
            showCode: true,
          },
        ),
        amount: minOrMax.amount,
      });
    }
  }

  if (isAnErrorCodeMessageError) {
    return getSwapAPIError(response.errorCode, response.errorMessage);
  }

  return new SwapGenericAPIError();
}
