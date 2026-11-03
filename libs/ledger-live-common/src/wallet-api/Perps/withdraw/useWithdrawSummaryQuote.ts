import { useEffect, useState } from "react";
import {
  fetchPerpsWithdrawQuote,
  PERPS_WITHDRAW_QUOTE_TTL_MS,
  type PerpsWithdrawQuoteParams,
  type WithdrawQuote,
} from "./quote";

export type PerpsWithdrawSummaryQuoteState = Readonly<{
  quote: WithdrawQuote;
  isRefreshing: boolean;
  error: Error | null;
}>;

type State = PerpsWithdrawSummaryQuoteState & Readonly<{ failures: number }>;

/**
 * Keeps the quote picked on the input fresh while the summary is open: it is
 * replaced when it expires, and the previous values stay on screen meanwhile.
 * A failed refresh is retried after the quote TTL. Nothing is fetched while
 * `enabled` is false (e.g. a closed sheet that stays mounted).
 */
export function usePerpsWithdrawSummaryQuote(
  initialQuote: WithdrawQuote,
  params: PerpsWithdrawQuoteParams,
  { enabled = true }: Readonly<{ enabled?: boolean }> = {},
): PerpsWithdrawSummaryQuoteState {
  const [state, setState] = useState<State>({
    quote: initialQuote,
    isRefreshing: false,
    error: null,
    failures: 0,
  });
  const { quote, failures } = state;

  useEffect(() => {
    if (!enabled) return;

    let stale = false;
    const delay =
      failures > 0 ? PERPS_WITHDRAW_QUOTE_TTL_MS : Math.max(quote.expiry - Date.now(), 0);
    const timeout = setTimeout(() => {
      setState(current => ({ ...current, isRefreshing: true }));
      fetchPerpsWithdrawQuote(params)
        .then(next => {
          if (!stale) setState({ quote: next, isRefreshing: false, error: null, failures: 0 });
        })
        .catch((error: unknown) => {
          if (stale) return;
          setState(current => ({
            ...current,
            isRefreshing: false,
            error: error instanceof Error ? error : new Error(String(error)),
            failures: current.failures + 1,
          }));
        });
    }, delay);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
    // The summary's inputs are fixed; only a new quote or a failure schedules the next refresh.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, failures, enabled]);

  return { quote, isRefreshing: state.isRefreshing, error: state.error };
}
