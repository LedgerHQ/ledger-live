import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { SwapQuotesRequestFailed } from "../../../../errors";
import { swapQuotesApi } from "../state-manager/api";
import { getSwapQuotesDispatch } from "../state-manager/store";

import type { GetQuotesArgs } from "../types";
import type { ResolvedQuotesInput } from "../resolveQuotesInput";
import type { FetchQuotesResult } from "./types";

// `signal` is omitted because RTK Query owns the request lifecycle: accepting
// one would be a silent no-op.
type FetchQuotesArgs = Omit<GetQuotesArgs, "data" | "signal"> & {
  data: ResolvedQuotesInput;
};

// A factory rather than a shared constant: callers forward `providerErrors`
// into their own response objects, so each call needs its own arrays.
const emptyResult = (): FetchQuotesResult => ({ rawQuotes: [], providerErrors: [] });

/**
 * The HTTP status behind an RTK Query error, or `undefined` when the request
 * never got a response. `PARSING_ERROR` carries `originalStatus`: the
 * aggregator answered but the body was not JSON, which its 4xx/5xx responses
 * frequently are not. `FETCH_ERROR`, `TIMEOUT_ERROR`, `CUSTOM_ERROR` and a
 * `SerializedError` all mean no response arrived.
 */
function getHttpStatus(error: FetchBaseQueryError | SerializedError): number | undefined {
  if (!("status" in error)) return undefined;
  if (typeof error.status === "number") return error.status;
  if (error.status === "PARSING_ERROR") return error.originalStatus;
  return undefined;
}

// `cause` is non-enumerable and so does not survive `serializeError` at the RPC
// boundary; fold the detail into the message instead.
function describeError(error: FetchBaseQueryError | SerializedError): string {
  if (!("status" in error)) return error.message ?? error.name ?? "unknown error";
  return "error" in error && error.error ? `${error.status}: ${error.error}` : String(error.status);
}

/**
 * Fetch the raw list of quotes from the aggregator API for a single
 * `custom.exchange.getQuotes` request.
 *
 * Thin wrapper around the {@link swapQuotesApi} `fetchQuotes` RTK Query
 * endpoint: it runs the query imperatively against the dispatch registered
 * by the host app (see `setSwapQuotesStore`), so quote requests flow through
 * the same Redux data layer as the rest of the app.
 *
 * @param args - Wire-level `getQuotes` arguments (providers, resolved quotes
 *   input, optional headers).
 * @param counterValueCurrency - Fiat ticker (e.g. `"USD"`) the
 *   aggregator should use for quote countervalues. Sourced from the
 *   wallet's counter-value setting at the handler factory call site.
 * @returns The raw aggregator payload split into successful quotes
 *   (`rawQuotes`) and per-provider rejection rows (`providerErrors`).
 *   Rejection rows carry an aggregator `code` (e.g. `amount_off_limits`)
 *   plus the provider's reason; consumers digest them into globals via
 *   `computeQuotesErrors`. A non-OK HTTP response becomes an empty result, so
 *   the caller surfaces `noQuotes`. This differs from the axios
 *   implementation: the shared `@ledgerhq/live-network` interceptor turned
 *   4xx/5xx into `LedgerAPI4xx`/`LedgerAPI5xx` and the live app saw an error.
 *   Only transport failures (no HTTP response) reject.
 */
export async function fetchQuotes(
  args: FetchQuotesArgs,
  counterValueCurrency: string,
): Promise<FetchQuotesResult> {
  const { providers, data: quotesInput, headers: customHeaders } = args;
  const dispatch = getSwapQuotesDispatch();

  const promise = dispatch(
    swapQuotesApi.endpoints.fetchQuotes.initiate(
      {
        providers,
        quotesInput,
        counterValueCurrency,
        customHeaders: customHeaders ? Object.fromEntries(customHeaders) : undefined,
      },
      // Bypass any cached entry: quotes are time-sensitive. The subscription is
      // held only for the lifetime of this call and released in `finally`, so
      // `keepUnusedDataFor: 0` still evicts the entry immediately. Without a
      // subscriber the entry can be collected before this promise resolves,
      // which reads back as an empty result. Concurrent identical requests are
      // still de-duplicated by RTK Query.
      { forceRefetch: true },
    ),
  );

  try {
    const result = await promise;

    if (result.error) {
      // The aggregator answering with a non-OK status yields an empty result so
      // the caller surfaces the same `noQuotes` global as the legacy UI. Only
      // transport failures (FETCH_ERROR / TIMEOUT_ERROR) reject.
      if (getHttpStatus(result.error) === undefined) {
        throw new SwapQuotesRequestFailed(
          `swap /quote request failed: ${describeError(result.error)}`,
          result.error,
        );
      }
      return emptyResult();
    }

    return result.data ?? emptyResult();
  } finally {
    promise.unsubscribe();
  }
}
