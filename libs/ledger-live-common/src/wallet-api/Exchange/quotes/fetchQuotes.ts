import axios from "axios";

import type { GetQuotesArgs, Quote, RawQuote, RawQuoteError } from "./types";

export async function fetchQuotes(args: GetQuotesArgs, baseURL: string): Promise<Quote> {
  const { providers, data: quotesInput, headers: customHeaders, signal } = args;

  const searchParams = new URLSearchParams();
  const requiredParams: Record<string, string> = {
    amountFrom: quotesInput.amount,
    displayLanguage: "en",
    lang: "en",
    theme: "dark",
    "providers-whitelist": providers.join(","),
    fiatForCounterValue: quotesInput.counterValueCurrency,
    currencyTicker: quotesInput.counterValueCurrency,
    networkFees: "0",
    uniswapOrderType: quotesInput.uniswapOrderType,
  };
  for (const [key, value] of Object.entries(requiredParams)) {
    searchParams.set(key, value);
  }

  const optionalParams: Array<[string, string | undefined]> = [
    ["from", quotesInput.sendCurrencyId],
    ["to", quotesInput.receiveCurrencyId],
    ["fromAccountId", quotesInput.sendAccountId],
    ["addressFrom", quotesInput.sendAddress],
    ["addressTo", quotesInput.receiveAddress],
    ["networkFeesCurrency", quotesInput.networkFeesCurrencyId],
  ];
  for (const [key, value] of optionalParams) {
    if (value) searchParams.set(key, value);
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

  return {
    quotes: data.filter((q): q is RawQuote => !("code" in q)),
    errors: data.filter((q): q is RawQuoteError => "code" in q),
  };
}
