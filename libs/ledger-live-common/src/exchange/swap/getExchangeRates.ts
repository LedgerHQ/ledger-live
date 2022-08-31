import type {
  CryptoCurrency,
  TokenCurrency,
  Unit,
} from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { getAccountCurrency, getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
} from "../../errors";
import network from "../../network";
import type { Transaction } from "../../generated/types";
import {
  getAvailableProviders,
  getSwapAPIBaseURL,
  getSwapAPIError,
  getSwapAPIVersion,
} from "./";
import { mockGetExchangeRates } from "./mock";
import type { CustomMinOrMaxError, Exchange, GetExchangeRates } from "./types";

const getExchangeRates: GetExchangeRates = async (
  exchange: Exchange,
  transaction: Transaction,
  userId?: string, // TODO remove when wyre doesn't require this for rates
  currencyTo?: TokenCurrency | CryptoCurrency | undefined | null
) => {
  if (getEnv("MOCK"))
    return mockGetExchangeRates(exchange, transaction, currencyTo);

  const usesV3 = getSwapAPIVersion() >= 3;
  const from = getAccountCurrency(exchange.fromAccount).id;
  const unitFrom = getAccountUnit(exchange.fromAccount);
  const unitTo =
    (currencyTo && currencyTo.units[0]) ?? getAccountUnit(exchange.toAccount);
  const to = (currencyTo ?? getAccountCurrency(exchange.toAccount)).id;
  const amountFrom = transaction.amount;
  const tenPowMagnitude = new BigNumber(10).pow(unitFrom.magnitude);
  const apiAmount = new BigNumber(amountFrom).div(tenPowMagnitude);
  const request = {
    from,
    to,
    amountFrom: apiAmount.toString(),
    providers: usesV3 ? getAvailableProviders() : undefined,
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

    const payoutNetworkFees = new BigNumber(maybePayoutNetworkFees || 0);

    const magnitudeAwarePayoutNetworkFees = payoutNetworkFees.times(
      new BigNumber(10).pow(unitTo.magnitude)
    );

    const rate = maybeRate
      ? new BigNumber(maybeRate)
      : new BigNumber(amountTo).minus(payoutNetworkFees).div(amountFrom);

    // NB Allows us to simply multiply satoshi values from/to
    const magnitudeAwareRate = rate.div(
      new BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude)
    );

    const toAmount = new BigNumber(amountTo).minus(payoutNetworkFees);

    const magnitudeAwareToAmount = toAmount.times(
      new BigNumber(10).pow(unitTo.magnitude)
    );
    // Nb no longer need to break it down on UI

    const out = {
      magnitudeAwareRate,
      provider,
      rate,
      rateId,
      toAmount: magnitudeAwareToAmount,
      tradeMethod,
    };

    if (tradeMethod === "fixed") {
      return { ...out, rateId };
    } else {
      return {
        ...out,
        payoutNetworkFees: magnitudeAwarePayoutNetworkFees,
      };
    }
  });
};

const inferError = (
  apiAmount: BigNumber,
  unitFrom: Unit,
  responseData: {
    amountTo: string;
    minAmountFrom: string;
    maxAmountFrom: string;
    errorCode?: number;
    errorMessage?: string;
  }
): Error | CustomMinOrMaxError | undefined => {
  const tenPowMagnitude = new BigNumber(10).pow(unitFrom.magnitude);
  const { amountTo, minAmountFrom, maxAmountFrom, errorCode, errorMessage } =
    responseData;

  if (!amountTo) {
    // We are in an error case regardless of api version.
    if (errorCode) {
      return getSwapAPIError(errorCode, errorMessage);
    }

    // For out of range errors we will have a min/max pairing
    if (minAmountFrom) {
      const isTooSmall = new BigNumber(apiAmount).lte(minAmountFrom);

      const MinOrMaxError = isTooSmall
        ? SwapExchangeRateAmountTooLow
        : SwapExchangeRateAmountTooHigh;

      const key: string = isTooSmall
        ? "minAmountFromFormatted"
        : "maxAmountFromFormatted";

      const amount = isTooSmall ? minAmountFrom : maxAmountFrom;

      return new MinOrMaxError(undefined, {
        [key]: formatCurrencyUnit(
          unitFrom,
          new BigNumber(amount).times(tenPowMagnitude),
          {
            alwaysShowSign: false,
            disableRounding: true,
            showCode: true,
          }
        ),
        amount: new BigNumber(amount),
      });
    }
  }
  return;
};

export default getExchangeRates;
