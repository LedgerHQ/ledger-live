// @flow

import type { Exchange, GetExchangeRates } from "./types";
import type { Transaction } from "../../types";
import { getAccountCurrency, getAccountUnit } from "../../account";
import type { Unit } from "../../types";
import { formatCurrencyUnit } from "../../currencies";
import { mockGetExchangeRates } from "./mock";
import network from "../../network";
import { getSwapAPIError, getSwapAPIBaseURL } from "./";
import { getEnv } from "../../env";
import { BigNumber } from "bignumber.js";
import {
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooHigh,
} from "../../errors";

const getExchangeRates: GetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction,
  userId?: string // TODO remove when wyre doesn't require this for rates
) => {
  if (getEnv("MOCK")) return mockGetExchangeRates(exchange, transaction);

  // Rely on the api base to determine the version logic
  const usesV3 = getSwapAPIBaseURL().endsWith("v3");
  const from = getAccountCurrency(exchange.fromAccount).id;
  const unitFrom = getAccountUnit(exchange.fromAccount);
  const unitTo = getAccountUnit(exchange.toAccount);
  const to = getAccountCurrency(exchange.toAccount).id;
  const amountFrom = transaction.amount;
  const tenPowMagnitude = BigNumber(10).pow(unitFrom.magnitude);
  const apiAmount = BigNumber(amountFrom).div(tenPowMagnitude);
  const request = {
    from,
    to,
    amountFrom: apiAmount.toString(),
  };
  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/rate`,
    headers: {
      ...(userId ? { userId } : {}),
    },
    data: usesV3 ? request : [request],
  });

  return res.data.map((responseData) => {
    const {
      rate: maybeRate,
      payoutNetworkFees: maybePayoutNetworkFees,
      rateId,
      provider,
      amountFrom,
      amountTo,
      tradeMethod,
    } = responseData;

    const error = inferError(apiAmount, unitFrom, responseData);
    if (error) {
      return {
        provider,
        tradeMethod,
        error,
      };
    }

    // NB Allows us to simply multiply satoshi values from/to
    const magnitudeAwareRate = (tradeMethod === "fixed"
      ? BigNumber(maybeRate)
      : BigNumber(amountTo).div(amountFrom)
    ).div(BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude));

    const payoutNetworkFees = BigNumber(maybePayoutNetworkFees || 0).times(
      BigNumber(10).pow(unitTo.magnitude)
    );

    const toAmount = BigNumber(amountTo)
      .times(BigNumber(10).pow(unitTo.magnitude))
      .minus(payoutNetworkFees); // Nb no longer need to break it down on UI

    const rate = maybeRate || BigNumber(amountTo).div(BigNumber(amountFrom));

    const out = {
      magnitudeAwareRate,
      provider,
      rate,
      rateId,
      toAmount,
      tradeMethod,
    };

    if (tradeMethod === "fixed") {
      return { ...out, rateId };
    } else {
      return {
        ...out,
        payoutNetworkFees,
      };
    }
  });
};

const inferError = (
  apiAmount: BigNumber,
  unitFrom: Unit,
  responseData: {
    amountTo: string,
    minAmountFrom: string,
    maxAmountFrom: string,
    errorCode?: number,
    errorMessage?: string,
  }
): ?Error => {
  const tenPowMagnitude = BigNumber(10).pow(unitFrom.magnitude);
  const {
    amountTo,
    minAmountFrom,
    maxAmountFrom,
    errorCode,
    errorMessage,
  } = responseData;

  if (!amountTo) {
    // We are in an error case regardless of api version.
    if (errorCode) {
      return getSwapAPIError(errorCode, errorMessage);
    }

    // For out of range errors we will have a min/max pairing
    if (minAmountFrom) {
      const isTooSmall = BigNumber(apiAmount).lte(minAmountFrom);

      const MinOrMaxError = isTooSmall
        ? SwapExchangeRateAmountTooLow
        : SwapExchangeRateAmountTooHigh;

      const key: string = isTooSmall
        ? "minAmountFromFormatted"
        : "maxAmountFromFormatted";

      const amount = isTooSmall ? minAmountFrom : maxAmountFrom;

      return new MinOrMaxError(null, {
        [key]: formatCurrencyUnit(
          unitFrom,
          BigNumber(amount).times(tenPowMagnitude),
          {
            alwaysShowSign: false,
            disableRounding: true,
            showCode: true,
          }
        ),
      });
    }
  }
  return;
};

export default getExchangeRates;
