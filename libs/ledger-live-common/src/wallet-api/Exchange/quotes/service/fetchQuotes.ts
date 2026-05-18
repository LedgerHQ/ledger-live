import axios from "axios";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

import type { GetQuotesArgs } from "../types";
import type { FetchQuotesResult, RawQuote, RawQuoteError } from "./types";

/**
 * Fetch the raw list of quotes from the aggregator API for a single
 * `custom.exchange.getQuotes` request.
 *
 * @param args - Wire-level `getQuotes` arguments (providers, quotes
 *   input, optional headers, abort signal).
 * @param counterValueCurrency - Fiat ticker (e.g. `"USD"`) the
 *   aggregator should use for quote countervalues. Sourced from the
 *   wallet's counter-value setting at the handler factory call site.
 * @returns The raw aggregator payload split into successful quotes and
 *   per-provider error entries.
 */
export async function fetchQuotes(
  args: GetQuotesArgs,
  counterValueCurrency: string,
): Promise<FetchQuotesResult> {
  const { providers, data: quotesInput, headers: customHeaders, signal } = args;
  const baseURL = getSwapAPIBaseURL();

  const searchParams = new URLSearchParams();
  const requiredParams: Record<string, string> = {
    amountFrom: quotesInput.amount,
    displayLanguage: "en",
    lang: "en",
    theme: "dark",
    "providers-whitelist": providers.join(","),
    fiatForCounterValue: counterValueCurrency,
    currencyTicker: counterValueCurrency,
    networkFees: "0",
    uniswapOrderType: quotesInput.uniswapOrderType ?? "classic",
    from: quotesInput.sendCurrencyId,
    to: quotesInput.receiveCurrencyId,
    fromAccountId: quotesInput.sendAccountId,
    addressFrom: quotesInput.sendAddress,
    addressTo: quotesInput.receiveAddress,
  };
  for (const [key, value] of Object.entries(requiredParams)) {
    searchParams.set(key, value);
  }

  if (quotesInput.networkFeesCurrencyId) {
    searchParams.set("networkFeesCurrency", quotesInput.networkFeesCurrencyId);
  }

  if (quotesInput.slippage != null) {
    searchParams.set("slippage", quotesInput.slippage.toString());
  }

  const url = `${baseURL}/quote?${searchParams.toString()}`;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(customHeaders ? Object.fromEntries(customHeaders) : {}),
  };

  const response = await axios.get(url, { headers: requestHeaders, signal });
  const data: Array<RawQuote | RawQuoteError> = response.data ?? [];

  const rawQuotes = data.filter((q): q is RawQuote => !("code" in q));
  const errors = data.filter((q): q is RawQuoteError => "code" in q);

  return { rawQuotes, errors };
}
