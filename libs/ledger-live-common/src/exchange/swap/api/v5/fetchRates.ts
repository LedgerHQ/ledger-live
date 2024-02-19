import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { ExchangeRate, ExchangeRateErrorDefault, ExchangeRateResponseRaw } from "../../types";
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

export const throwRateError = (response: ExchangeRate[]) => {
  // ranked errors so incases where all rates error we return
  // the highest priority error to the user.
  // lowest number is the highest rank.
  // highest number is lowest rank.
  const errorsRank = {
    SwapExchangeRateAmountTooLowOrTooHigh: 1,
    SwapExchangeRateAmountTooLow: 2,
    SwapExchangeRateAmountTooHigh: 3,
  };

  const filterLimitResponse = response.filter(rate => {
    const name = rate.error && rate.error["name"];
    return name && errorsRank[name];
  });
  if (!filterLimitResponse.length) throw new SwapGenericAPIError();

  // get the highest ranked error and throw it.
  const initError = filterLimitResponse[0].error;
  const error = filterLimitResponse.reduce((acc, curr) => {
    const currError = curr.error;
    if (!acc || !currError || !acc["name"] || !currError["name"]) return acc;
    const currErrorRank: number = errorsRank[currError["name"]];
    const accErrorRank: number = errorsRank[acc["name"]];

    if (currErrorRank <= accErrorRank) {
      if (currErrorRank === 1) return currError;

      const currErrorLimit = currError["amount"];
      const accErrorLimit = acc["amount"];

      // Get smallest amount supported
      if (
        currErrorRank === 2 &&
        currErrorLimit &&
        currErrorLimit.isLessThan(accErrorLimit || Infinity)
      ) {
        return curr.error;
      }

      // Get highest amount supported
      if (
        currErrorRank === 3 &&
        currErrorLimit &&
        currErrorLimit.isGreaterThan(accErrorLimit || -Infinity)
      ) {
        return curr.error;
      }
    }

    return acc;
  }, initError);

  throw error;
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
    const filteredData = data.filter(
      response => ![300, 304, 306, 308].includes((response as ExchangeRateErrorDefault)?.errorCode),
    ); // remove backend only errors
    const enrichedResponse = enrichRatesResponse(filteredData, unitTo, unitFrom);

    const allErrored = enrichedResponse.every(res => !!res.error);

    if (allErrored) {
      throwRateError(enrichedResponse);
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
