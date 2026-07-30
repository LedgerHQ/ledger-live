import { createApi } from "@reduxjs/toolkit/query";
import { createAuthenticatedBaseQuery } from "@shared/auth";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

import type { ResolvedQuotesInput } from "../resolveQuotesInput";
import type { FetchQuotesResult, RawQuote, RawQuoteError } from "../service/types";

/**
 * Serializable arguments for the {@link swapQuotesApi} `fetchQuotes`
 * endpoint. Mirrors the inputs the legacy `fetchQuotes` axios helper
 * consumed, flattened into a single object so RTK Query can use it as a
 * cache key.
 */
export type FetchQuotesQueryArgs = {
  providers: string[];
  quotesInput: ResolvedQuotesInput;
  /** Fiat ticker (e.g. `"USD"`) the aggregator should use for quote countervalues. */
  counterValueCurrency: string;
  /** Optional caller-supplied headers, already flattened to a plain object. */
  customHeaders?: Record<string, string>;
};

/**
 * Build the aggregator `/quote` query string parameters, matching the
 * parameters the legacy axios helper sent.
 */
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

/**
 * Split the raw aggregator payload into successful quote rows (`rawQuotes`)
 * and per-provider rejection rows (`providerErrors`). Rejection rows are the
 * ones carrying an aggregator `code` field.
 */
export function splitQuotes(data: Array<RawQuote | RawQuoteError>): FetchQuotesResult {
  const rawQuotes = data.filter((q): q is RawQuote => !("code" in q));
  const providerErrors = data.filter((q): q is RawQuoteError => "code" in q);
  return { rawQuotes, providerErrors };
}

/**
 * Reshape a successful `/quote` response body into a {@link FetchQuotesResult}.
 * Only 2xx responses reach here; a body that is not an array yields an empty
 * result rather than passing a malformed payload downstream. Non-OK statuses
 * surface as RTK Query errors and are mapped by `fetchQuotes`.
 */
export function transformFetchQuotesResponse(response: unknown): FetchQuotesResult {
  return splitQuotes(Array.isArray(response) ? (response as Array<RawQuote | RawQuoteError>) : []);
}

/**
 * RTK Query API for the swap quotes aggregator. Exposed as a single
 * `fetchQuotes` query that replaces the legacy axios `fetchQuotes` helper.
 *
 * Consumed imperatively from the server-side `getQuotes` flow (not a React
 * hook) via `dispatch(swapQuotesApi.endpoints.fetchQuotes.initiate(...))`,
 * mirroring the `cryptoAssetsApi` (CAL client) pattern.
 *
 * Unlike the legacy axios call, `/quote` is authenticated: once `authSDK` is
 * registered on the store's `extra` the request carries an `Authorization`
 * header, and 401/403 trigger the adapter's refresh-and-retry. HTTP status
 * errors are deliberately left as RTK Query errors so that retry can fire;
 * `fetchQuotes` maps them to the legacy empty-result outcome.
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
          Accept: "application/json",
          ...(customHeaders ?? {}),
        },
      }),
      transformResponse: transformFetchQuotesResponse,
      // Quotes are time-sensitive: never retain them between requests.
      keepUnusedDataFor: 0,
    }),
  }),
});
