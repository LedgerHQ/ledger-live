import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { SwapQuotesRequestFailed } from "../../../../errors";
import { swapQuotesApi } from "../state-manager/api";
import { getSwapQuotesDispatch } from "../state-manager/store";

import type { GetQuotesArgs } from "../types";
import type { ResolvedQuotesInput } from "../resolveQuotesInput";
import type { FetchQuotesResult } from "./types";

// `signal` omitted: RTK Query owns the request lifecycle, so honouring it is
// impossible and accepting it would be a silent no-op.
type FetchQuotesArgs = Omit<GetQuotesArgs, "data" | "signal"> & {
  data: ResolvedQuotesInput;
};

// A factory, not a constant: callers forward `providerErrors` into their own
// response objects, so each call needs its own arrays.
const emptyResult = (): FetchQuotesResult => ({ rawQuotes: [], providerErrors: [] });

/**
 * `undefined` when no response arrived. `PARSING_ERROR` still carries a status
 * in `originalStatus` — the aggregator answered, the body just was not JSON.
 */
function getHttpStatus(error: FetchBaseQueryError | SerializedError): number | undefined {
  if (!("status" in error)) return undefined;
  if (typeof error.status === "number") return error.status;
  if (error.status === "PARSING_ERROR") return error.originalStatus;
  return undefined;
}

// `cause` is non-enumerable and does not survive `serializeError` at the RPC
// boundary, so the detail has to go in the message.
function describeError(error: FetchBaseQueryError | SerializedError): string {
  if (!("status" in error)) return error.message ?? error.name ?? "unknown error";
  return "error" in error && error.error ? `${error.status}: ${error.error}` : String(error.status);
}

/**
 * Fetch the raw list of quotes from the aggregator API for a single
 * `custom.exchange.getQuotes` request.
 *
 * Runs the {@link swapQuotesApi} endpoint imperatively against the dispatch
 * registered by the host app via `setSwapQuotesStore`.
 *
 * @param counterValueCurrency - Fiat ticker (e.g. `"USD"`) for quote
 *   countervalues, from the wallet's counter-value setting.
 * @returns Successful quotes and per-provider rejection rows. A non-OK HTTP
 *   response yields an empty result; only transport failures reject.
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
      // Do not pass `subscribe: false`: without a subscriber,
      // `keepUnusedDataFor: 0` can evict the entry before this promise resolves
      // and the result reads back empty.
      { forceRefetch: true },
    ),
  );

  try {
    const result = await promise;

    if (result.error) {
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
