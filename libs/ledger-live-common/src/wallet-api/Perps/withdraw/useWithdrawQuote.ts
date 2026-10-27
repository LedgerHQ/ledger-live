import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { fetchPerpsWithdrawQuote, type WithdrawQuote } from "./quote";

const QUOTE_DEBOUNCE_MS = 500;

export type PerpsWithdrawQuoteParams = {
  amount: string;
  sourceAccount: AccountLike;
  destinationAccount: AccountLike | undefined;
  accounts: AccountLike[];
  counterValueCurrency: string;
};

export type PerpsWithdrawQuoteState = {
  quote: WithdrawQuote | undefined;
  isLoading: boolean;
  error: Error | null;
};

const IDLE: PerpsWithdrawQuoteState = { quote: undefined, isLoading: false, error: null };
const LOADING: PerpsWithdrawQuoteState = { quote: undefined, isLoading: true, error: null };

function requestKeyOf({
  amount,
  sourceAccount,
  destinationAccount,
  counterValueCurrency,
}: PerpsWithdrawQuoteParams) {
  if (!destinationAccount || !new BigNumber(amount).isGreaterThan(0)) return null;
  return [amount, sourceAccount.id, destinationAccount.id, counterValueCurrency].join("|");
}

/** Debounced swap quote, refreshed when the amount or destination changes and when it expires. */
export function usePerpsWithdrawQuote(params: PerpsWithdrawQuoteParams): PerpsWithdrawQuoteState {
  const { amount, sourceAccount, destinationAccount, accounts, counterValueCurrency } = params;
  const requestKey = requestKeyOf(params);
  const [current, setCurrent] = useState<{ key: string | null; state: PerpsWithdrawQuoteState }>({
    key: null,
    state: IDLE,
  });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (requestKey === null || !destinationAccount) {
      setCurrent({ key: null, state: IDLE });
      return;
    }

    setCurrent({ key: requestKey, state: LOADING });

    let stale = false;
    let expiryTimeout: ReturnType<typeof setTimeout> | undefined;
    const timeout = setTimeout(() => {
      fetchPerpsWithdrawQuote({
        accounts,
        sourceAccount,
        destinationAccount,
        amount,
        counterValueCurrency,
      })
        .then(quote => {
          if (stale) return;
          setCurrent({ key: requestKey, state: { quote, isLoading: false, error: null } });
          expiryTimeout = setTimeout(
            () => setRefreshCount(count => count + 1),
            Math.max(quote.expiry - Date.now(), 0),
          );
        })
        .catch((error: unknown) => {
          if (stale) return;
          setCurrent({
            key: requestKey,
            state: {
              quote: undefined,
              isLoading: false,
              error: error instanceof Error ? error : new Error(String(error)),
            },
          });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
      clearTimeout(expiryTimeout);
    };
    // The key covers every input; account churn must not restart the request.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, refreshCount]);

  // Effects run a render late, so a stale result is dropped here instead.
  if (current.key !== requestKey) return requestKey === null ? IDLE : LOADING;
  return current.state;
}
