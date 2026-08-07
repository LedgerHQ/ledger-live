import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

import { swapApi } from "@shared/api-services";

import { RawQuoteErrorSchema, RawQuoteSchema } from "./schema";
import type {
  FetchQuotesQueryArgs,
  FetchQuotesResult,
  RawQuote,
  RawQuoteError,
  ResolvedQuotesInput,
} from "./types";

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

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

/**
 * Digest of `customHeaders` for the cache key.
 *
 * RTK Query's `condition` returns early on `status === "pending"` *before* it consults
 * `forceRefetch`, so requests sharing a cache key are deduped while in flight. With the headers
 * omitted entirely, two concurrent calls differing only by header would share one request and the
 * second caller would receive a body fetched with the first caller's headers — `headers` is
 * arbitrary live-app input, so that is not ours to assume is harmless.
 *
 * Hashing rather than including them verbatim keeps a live-app token out of redux state, which is
 * the point of leaving them out of the key in the first place.
 *
 * The digest is what keeps those requests apart, and `headers` is chosen by the live app, so it has
 * to be collision-resistant: a digest an app can deliberately collide would hand it back the
 * separation this exists to provide. SHA-256 is used rather than a fast non-cryptographic hash for
 * that reason alone — it must also stay synchronous, which rules out `crypto.subtle`.
 */
export function hashCustomHeaders(customHeaders?: Record<string, string>): string {
  const entries = Object.entries(customHeaders ?? {});
  if (entries.length === 0) return "";

  // Header names are case-insensitive and order carries no meaning, so canonicalise both. Each
  // pair is JSON-encoded rather than concatenated raw: a value containing the separator would
  // otherwise let two different header sets share one canonical string, and so one digest.
  const canonical = entries
    .map(([name, value]) => JSON.stringify([name.toLowerCase(), value]))
    .sort((a, b) => (a < b ? -1 : Number(a > b)))
    .join("\n");

  return bytesToHex(sha256(utf8ToBytes(canonical)));
}

/**
 * Swap quotes endpoint, injected into the shared swap aggregator api.
 *
 * Consumed imperatively from the server-side `getQuotes` flow rather than through a hook, so no query
 * hook is exported. HTTP status errors are left as RTK Query errors so the auth adapter's 401/403
 * refresh-and-retry can fire; the caller maps them.
 */
export const swapQuotesApi = swapApi.injectEndpoints({
  endpoints: build => ({
    fetchQuotes: build.query<FetchQuotesResult, FetchQuotesQueryArgs>({
      query: ({ providers, quotesInput, counterValueCurrency, customHeaders }) => ({
        url: "/quote",
        params: buildQuotesParams(providers, quotesInput, counterValueCurrency),
        headers: { ...customHeaders },
      }),
      // Headers are represented by a digest rather than verbatim: the token stays out of the cache
      // key, while callers sending different headers still get separate entries instead of sharing
      // one in-flight request. See {@link hashCustomHeaders}.
      serializeQueryArgs: ({ queryArgs }) => {
        const { customHeaders, ...cacheable } = queryArgs;
        return { ...cacheable, customHeadersHash: hashCustomHeaders(customHeaders) };
      },
      transformResponse: transformFetchQuotesResponse,
      // Quotes are time-sensitive: never retain them between requests.
      keepUnusedDataFor: 0,
    }),
  }),
});

export type SwapQuotesApi = typeof swapQuotesApi;
