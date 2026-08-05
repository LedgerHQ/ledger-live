import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { log } from "@ledgerhq/logs";

import { SwapQuotesRequestFailed } from "../../../../errors";
import { swapQuotesApi } from "../state-manager/api";
import type { SwapQuotesDispatch } from "../state-manager/store";

import type { GetQuotesArgs } from "../types";
import type { ResolvedQuotesInput } from "../resolveQuotesInput";
import type { FetchQuotesResult } from "./types";

// `signal` omitted: nothing supplies one. If an in-process caller ever needs
// cancellation, abort the `initiate()` promise below rather than forwarding it.
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
 * supplied by the caller, which threads it down from the host app's store.
 *
 * @param counterValueCurrency - Fiat ticker (e.g. `"USD"`) for quote
 *   countervalues, from the wallet's counter-value setting.
 * @param dispatch - Store dispatch used to run the endpoint.
 * @returns Successful quotes and per-provider rejection rows. A non-OK HTTP
 *   response yields an empty result; only transport failures reject.
 */
export async function fetchQuotes(
  args: FetchQuotesArgs,
  counterValueCurrency: string,
  dispatch: SwapQuotesDispatch,
): Promise<FetchQuotesResult> {
  const { providers, data: quotesInput, headers: customHeaders } = args;

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
      const status = getHttpStatus(result.error);

      if (status === undefined) {
        throw new SwapQuotesRequestFailed(
          `swap /quote request failed: ${describeError(result.error)}`,
          result.error,
        );
      }

      // The aggregator answered with an error and the caller will surface this as
      // "no quotes", which is indistinguishable from an empty result. This log is
      // the only remaining signal that the request failed at all — the old axios
      // interceptor emitted it before the migration to RTK Query.
      log("network-error", `${status} GET /quote: ${describeError(result.error)}`);
      return emptyResult();
    }

    return result.data ?? emptyResult();
  } finally {
    promise.unsubscribe();
  }
}
