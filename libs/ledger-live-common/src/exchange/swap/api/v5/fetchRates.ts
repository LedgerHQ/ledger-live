import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { ExchangeRate, ExchangeRateResponseRaw } from "../../types";
import { Unit } from "@ledgerhq/live-app-sdk";
import { SwapGenericAPIError } from "../../../../errors";
import { enrichRatesResponse } from "../../utils/enrichRatesResponse";
import { isIntegrationTestEnv } from "../../utils/isIntegrationTestEnv";
import { fetchRatesMock } from "./__mocks__/fetchRates.mocks";
import { getSwapAPIBaseURL } from "../..";

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
  if (isIntegrationTestEnv()) {
    return Promise.resolve(
      enrichRatesResponse(fetchRatesMock(fromCurrencyAmount, currencyFrom), unitTo, unitFrom),
    );
  }

  const url = new URL(`${getSwapAPIBaseURL()}/rate`);
  const requestBody = {
    from: currencyFrom,
    to: toCurrencyId,
    amountFrom: fromCurrencyAmount, // not sure why amountFrom thinks it can be undefined here
    providers,
  };

  try {
    const { data } = await network<ExchangeRateResponseRaw[]>({
      method: "POST",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      data: requestBody,
    });
    const enrichedResponse = enrichRatesResponse(data, unitTo, unitFrom);

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
    return enrichedResponse
      .filter(res => !res.error)
      .sort((a, b) => b.toAmount.minus(a.toAmount).toNumber());
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
