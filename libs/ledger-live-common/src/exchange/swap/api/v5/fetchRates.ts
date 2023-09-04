import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { ExchangeRate, ExchangeRateV5Errors, ExchangeRateV5ResponseRaw } from "../../types";
import { Unit } from "@ledgerhq/live-app-sdk";
import { getSwapAPIError } from "../..";
import {
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLow,
  SwapGenericAPIError,
} from "../../../../errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";

type Props = {
  providers: Array<string>;
  currencyFrom?: string;
  toCurrencyId?: string;
  fromCurrencyAmount: string;
  unitTo: Unit;
  unitFrom: Unit;
};

export async function fetchRates({
  providers,
  currencyFrom,
  toCurrencyId,
  unitTo,
  unitFrom,
  fromCurrencyAmount,
}: Props): Promise<ExchangeRate[]> {
  const url = new URL(`${getEnv("SWAP_API_BASE_V5")}/rate`);
  const requestBody = {
    from: currencyFrom,
    to: toCurrencyId,
    amountFrom: fromCurrencyAmount, // not sure why amountFrom thinks it can be undefined here
    providers,
  };

  try {
    const { data } = await network<ExchangeRateV5ResponseRaw[]>({
      method: "POST",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      data: requestBody,
    });
    const enrichedResponse = data.map<ExchangeRate>(r => {
      if (r.status === "success") {
        const rate =
          r.tradeMethod === "fixed"
            ? BigNumber(r.rate)
            : BigNumber(r.amountTo).minus(r.payoutNetworkFees).div(r.amountFrom);

        const magnitudeAwareToAmount = BigNumber(r.amountTo)
          .minus(r.payoutNetworkFees)
          .times(new BigNumber(10).pow(unitTo.magnitude));

        const magnitudeAwarePayoutNetworkFees = BigNumber(r.payoutNetworkFees).times(
          new BigNumber(10).pow(unitTo.magnitude),
        );

        const magnitudeAwareRate = rate.div(
          new BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude),
        );

        return {
          ...(r.tradeMethod === "fixed" ? { expirationTime: Number(r.expirationTime) } : {}),
          magnitudeAwareRate,
          payoutNetworkFees: magnitudeAwarePayoutNetworkFees,
          provider: r.provider,
          providerType: r.providerType,
          providerURL: r.providerURL,
          rate,
          rateId: r.rateId,
          toAmount: magnitudeAwareToAmount,
          tradeMethod: r.tradeMethod,
        };
      }

      const error = r.status === "error" ? inferError(r, unitFrom) : undefined;
      return {
        magnitudeAwareRate: BigNumber(0),
        payoutNetworkFees: BigNumber(0),
        provider: r.provider,
        providerType: r.providerType,
        rate: undefined,
        toAmount: BigNumber(0),
        tradeMethod: r.tradeMethod,
        error,
      };
    });

    const allErrored = enrichedResponse.every(res => !!res.error);

    if (allErrored) {
      // ranked errors so incases where all rates error we return
      // the highest priority error to the user.
      // lowest number is the highest rank.
      // highest number is lowest rank.
      const errorsRank = {
        SwapExchangeRateAmountTooLowOrTooHigh: 1,
        SwapExchangeRateAmountTooLow: 2,
        SwapExchangeRateAmountTooHigh: 3,
      };

      // get the highest ranked error and throw it.
      const error = enrichedResponse.reduce<Error>((acc, curr) => {
        if (!curr.error) return acc;

        const currErrorRank: number = errorsRank[curr.error.name] ?? Infinity;
        const accErrorRank: number = errorsRank[acc.name] ?? Infinity;

        if (currErrorRank < accErrorRank) {
          return curr.error;
        }
        return acc;
      }, new SwapGenericAPIError());
      throw error;
    }

    // if some of the rates are successful then return those.
    return enrichedResponse.filter(res => !res.error);
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.code === "ECONNABORTED") {
        // TODO: LIVE-8901 (handle request timeout)
      }
    }
    if (e instanceof LedgerAPI4xx) {
      // TODO: LIVE-8901 (handle 4xx)
    }
    throw e;
  }
}

const inferError = (response: ExchangeRateV5Errors, unitFrom: Unit): Error | undefined => {
  const isAMinMaxError =
    "minAmountFrom" in response &&
    "maxAmountFrom" in response &&
    "amountRequested" in response &&
    !!response.minAmountFrom &&
    !!response.maxAmountFrom &&
    !!response.amountRequested;

  const isAnErrorCodeMessageError = "errorCode" in response && "errorMessage" in response;

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
};
