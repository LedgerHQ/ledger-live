import { createApi } from "@reduxjs/toolkit/query";
import { createAuthenticatedBaseQuery } from "@shared/auth";
import { getEnv } from "@shared/env";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

import type { ResolvedQuotesInput } from "../resolveQuotesInput";
import type { FetchQuotesResult, RawQuote, RawQuoteError } from "../service/types";

export type FetchQuotesQueryArgs = {
  providers: string[];
  quotesInput: ResolvedQuotesInput;
  counterValueCurrency: string;
  customHeaders?: Record<string, string>;
};

export function buildQuotesParams(
  providers: string[],
  quotesInput: ResolvedQuotesInput,
  counterValueCurrency: string,
): Record<string, string> {
  const params: Record<string, string> = {
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

  if (quotesInput.networkFeesCurrencyId) {
    params.networkFeesCurrency = quotesInput.networkFeesCurrencyId;
  }

  if (quotesInput.slippage != null) {
    params.slippage = quotesInput.slippage.toString();
  }

  return params;
}

/** Rejection rows are the ones carrying an aggregator `code` field. */
export function splitQuotes(data: Array<RawQuote | RawQuoteError>): FetchQuotesResult {
  const rawQuotes = data.filter((q): q is RawQuote => !("code" in q));
  const providerErrors = data.filter((q): q is RawQuoteError => "code" in q);
  return { rawQuotes, providerErrors };
}

/** Only 2xx responses reach here; non-OK statuses surface as RTK Query errors. */
export function transformFetchQuotesResponse(response: unknown): FetchQuotesResult {
  return splitQuotes(Array.isArray(response) ? (response as Array<RawQuote | RawQuoteError>) : []);
}

// `fetch` does not inherit the axios default headers `@ledgerhq/live-network` sets.
function clientVersionHeader(): Record<string, string> {
  const version = getEnv("LEDGER_CLIENT_VERSION");
  return version ? { "X-Ledger-Client-Version": version } : {};
}

/**
 * Consumed imperatively from the server-side `getQuotes` flow rather than
 * through a hook. HTTP status errors are left as RTK Query errors so the auth
 * adapter's 401/403 refresh-and-retry can fire; `fetchQuotes` maps them.
 */
export const swapQuotesApi = createApi({
  reducerPath: "swapQuotesApi",
  baseQuery: createAuthenticatedBaseQuery({
    // The aggregator base URL is resolved per-request (from SWAP_API_BASE) in
    // each endpoint's `query`, so the static base URL stays empty.
    baseUrl: "",
  }),
  endpoints: build => ({
    fetchQuotes: build.query<FetchQuotesResult, FetchQuotesQueryArgs>({
      query: ({ providers, quotesInput, counterValueCurrency, customHeaders }) => ({
        url: `${getSwapAPIBaseURL()}/quote`,
        params: buildQuotesParams(providers, quotesInput, counterValueCurrency),
        headers: {
          ...clientVersionHeader(),
          ...(customHeaders ?? {}),
        },
      }),
      // Keeps a live-app token out of the cache key. Consequence: concurrent
      // requests differing only by `customHeaders` share one in-flight call.
      serializeQueryArgs: ({ queryArgs }) => {
        const { customHeaders: _omitted, ...cacheable } = queryArgs;
        return cacheable;
      },
      transformResponse: transformFetchQuotesResponse,
      // Quotes are time-sensitive: never retain them between requests.
      keepUnusedDataFor: 0,
    }),
  }),
});
