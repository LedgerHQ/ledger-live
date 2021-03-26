// @flow

import type { Exchange, GetExchangeRates } from "./types";
import type { Transaction } from "../../types";
import { getAccountCurrency, getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { mockGetExchangeRates } from "./mock";
import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import { getEnv } from "../../env";
import { BigNumber } from "bignumber.js";
import {
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooHigh,
} from "../../errors";

const getExchangeRates: GetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction
) => {
  if (getEnv("MOCK")) return mockGetExchangeRates(exchange, transaction);

  const from = getAccountCurrency(exchange.fromAccount).id;
  const unitFrom = getAccountUnit(exchange.fromAccount);
  const unitTo = getAccountUnit(exchange.toAccount);
  const to = getAccountCurrency(exchange.toAccount).id;
  const amountFrom = transaction.amount;
  const tenPowMagnitude = BigNumber(10).pow(unitFrom.magnitude);
  const apiAmount = BigNumber(amountFrom).div(tenPowMagnitude);

  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/rate`,
    data: [
      {
        from,
        to,
        amountFrom: apiAmount.toString(),
      },
    ],
  });

  return res.data.map(
    ({
      rate,
      rateId,
      provider,
      amountFrom,
      amountTo,
      minAmountFrom,
      maxAmountFrom,
      tradeMethod,
      payoutNetworkFees,
    }) => {
      let error;
      let magnitudeAwareRate;

      if (!amountFrom) {
        const isTooSmall = BigNumber(apiAmount).lte(minAmountFrom);

        error = isTooSmall
          ? new SwapExchangeRateAmountTooLow(null, {
              minAmountFromFormatted: formatCurrencyUnit(
                unitFrom,
                BigNumber(minAmountFrom).times(tenPowMagnitude),
                {
                  alwaysShowSign: false,
                  disableRounding: true,
                  showCode: true,
                }
              ),
            })
          : new SwapExchangeRateAmountTooHigh(null, {
              maxAmountFromFormatted: formatCurrencyUnit(
                unitFrom,
                BigNumber(maxAmountFrom).times(tenPowMagnitude),
                {
                  alwaysShowSign: false,
                  disableRounding: true,
                  showCode: true,
                }
              ),
            });
      } else {
        // NB Allows us to simply multiply satoshi values from/to
        magnitudeAwareRate = (tradeMethod === "fixed"
          ? BigNumber(rate)
          : BigNumber(amountTo).div(amountFrom)
        ).div(BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude));
      }

      return {
        magnitudeAwareRate,
        provider,
        tradeMethod,
        toAmount: BigNumber(amountTo).times(
          BigNumber(10).pow(unitTo.magnitude)
        ),
        ...(tradeMethod === "fixed"
          ? { rate, rateId }
          : {
              rate: BigNumber(amountTo).div(amountFrom),
              payoutNetworkFees: BigNumber(payoutNetworkFees).times(
                BigNumber(10).pow(unitTo.magnitude)
              ),
            }),
        error,
      };
    }
  );
};

export default getExchangeRates;
