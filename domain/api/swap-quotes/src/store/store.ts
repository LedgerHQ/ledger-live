/**
 * Dispatch type for the {@link swapQuotesApi} endpoints.
 *
 * `fetchQuotes` runs server-side inside the wallet-api `getQuotes` flow rather
 * than from a React component, so it cannot use the generated query hook. The
 * host app's dispatch is threaded down to it through `GetQuotesContext`, which
 * every caller already builds — so a host that registers the reducer but never
 * supplies a dispatch fails to compile rather than throwing on the first quote.
 */
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

export type SwapQuotesDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;
