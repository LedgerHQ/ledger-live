import {
  createApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createAuthenticatedBaseQuery } from "@shared/auth";

import { RawQuoteErrorSchema, RawQuoteSchema, SwapQuotesApiExtraSchema } from "./schema";
import type {
  FetchQuotesQueryArgs,
  FetchQuotesResult,
  RawQuote,
  RawQuoteError,
  ResolvedQuotesInput,
  SwapQuotesApiExtra,
} from "./types";

/**
 * Builds this api's slice of the thunk `extraArgument`. RTK leaves
 * `extraArgument` untyped, so this is the one compile- and runtime-checked
 * entry point.
 */
export function swapQuotesApiExtra(extra: SwapQuotesApiExtra): SwapQuotesApiExtra {
  return SwapQuotesApiExtraSchema.parse(extra);
}

export function getSwapQuotesExtra(api: { extra: unknown }): SwapQuotesApiExtra {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return api.extra as SwapQuotesApiExtra;
}

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

/**
 * Only 2xx responses reach here; non-OK statuses surface as RTK Query errors.
 *
 * Rows are validated but never discarded: a provider shipping an unexpected
 * shape would otherwise make its quote silently vanish. Mismatches are logged
 * so the schema can be tightened once real payloads are known to conform.
 */
export function transformFetchQuotesResponse(response: unknown): FetchQuotesResult {
  if (!Array.isArray(response)) return { rawQuotes: [], providerErrors: [] };

  const rows = response as Array<RawQuote | RawQuoteError>;
  const result = splitQuotes(rows);

  // Validate each row against the one schema it should match, rather than the
  // union: a union failure reports both branches and buries the real issue.
  for (const [schema, group] of [
    [RawQuoteSchema, result.rawQuotes],
    [RawQuoteErrorSchema, result.providerErrors],
  ] as const) {
    for (const row of group) {
      const parsed = schema.safeParse(row);
      if (!parsed.success) {
        console?.warn("swapQuotesApi: /quote row did not match the schema", parsed.error.issues);
      }
    }
  }

  return result;
}

/** Reads the injected config and delegates to the authenticated base query. */
const swapQuotesBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const extra = getSwapQuotesExtra(api);
  return createAuthenticatedBaseQuery({
    baseUrl: extra.swapApiBaseUrl,
    // `fetch` does not inherit the axios default headers the legacy helper got
    // from `@ledgerhq/live-network`.
    prepareHeaders: headers => {
      headers.set("X-Ledger-Client-Version", extra.ledgerClientVersion);
      return headers;
    },
  })(args, api, extraOptions);
};

/**
 * Consumed imperatively from the server-side `getQuotes` flow rather than
 * through a hook. HTTP status errors are left as RTK Query errors so the auth
 * adapter's 401/403 refresh-and-retry can fire; the caller maps them.
 */
export const swapQuotesApi = createApi({
  reducerPath: "swapQuotesApi",
  baseQuery: swapQuotesBaseQuery,
  endpoints: build => ({
    fetchQuotes: build.query<FetchQuotesResult, FetchQuotesQueryArgs>({
      query: ({ providers, quotesInput, counterValueCurrency, customHeaders }) => ({
        url: "/quote",
        params: buildQuotesParams(providers, quotesInput, counterValueCurrency),
        headers: { ...(customHeaders ?? {}) },
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
